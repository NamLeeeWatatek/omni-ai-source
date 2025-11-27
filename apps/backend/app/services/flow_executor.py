"""
Flow Executor Service
Executes workflow nodes and tracks execution progress
With real-time event streaming (n8n style)
"""
from datetime import datetime
from typing import Dict, Any, List, AsyncGenerator, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.execution import WorkflowExecution, NodeExecution
from app.models.flow import Flow
import asyncio


class FlowExecutor:
    """Executes workflow and tracks node execution"""
    
    def __init__(self, session: Optional[AsyncSession] = None):
        self.session = session
    
    async def execute_with_events(
        self,
        flow_id: int,
        input_data: Dict[str, Any],
        user_id: str
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Execute workflow and yield events for SSE streaming
        Following n8n event pattern
        """
        from app.db.session import get_session
        
        # Get session if not provided
        if not self.session:
            async for session in get_session():
                self.session = session
                break
        
        try:
            # Get flow
            flow = await self.session.get(Flow, flow_id)
            if not flow:
                raise ValueError(f"Flow {flow_id} not found")
            
            nodes = flow.data.get('nodes', []) if flow.data else []
            edges = flow.data.get('edges', []) if flow.data else []
            
            # Create execution record
            execution = WorkflowExecution(
                flow_id=flow_id,
                status='running',
                started_at=datetime.utcnow(),
                input_data=input_data,
                total_nodes=len(nodes),
                completed_nodes=0
            )
            
            self.session.add(execution)
            await self.session.commit()
            await self.session.refresh(execution)
            
            # Yield execution started event
            yield {
                'type': 'executionStarted',
                'data': {
                    'executionId': execution.id,
                    'mode': 'manual'
                }
            }
            
            # Execute nodes
            node_outputs = {}
            sorted_nodes = self._topological_sort(nodes, edges)
            
            for node in sorted_nodes:
                node_id = node['id']
                node_label = node.get('data', {}).get('label', node_id)
                
                print(f"🔵 [SSE] Yielding nodeExecutionBefore for: {node_label}")
                
                # Yield node execution before event
                yield {
                    'type': 'nodeExecutionBefore',
                    'data': {
                        'executionId': execution.id,
                        'nodeName': node_label
                    }
                }
                
                # Execute node
                try:
                    print(f"⚙️ [SSE] Executing node: {node_label}")
                    start_time = datetime.utcnow()
                    output = await self._execute_node(execution, node, node_outputs)
                    end_time = datetime.utcnow()
                    print(f"✅ [SSE] Node completed: {node_label}")
                    
                    node_outputs[node_id] = output
                    execution.completed_nodes += 1
                    # ❌ Removed commit here to prevent blocking SSE stream
                    # await self.session.commit()
                    
                    print(f"🟢 [SSE] Yielding nodeExecutionAfter for: {node_label}")
                    
                    # Yield node execution after event
                    yield {
                        'type': 'nodeExecutionAfter',
                        'data': {
                            'executionId': execution.id,
                            'nodeName': node_label,
                            'data': output
                        }
                    }
                    
                except Exception as e:
                    # Node execution failed (already recorded in _execute_node)
                    execution.status = 'failed'
                    execution.error_message = str(e)
                    await self.session.commit()
                    
                    # Yield error event
                    yield {
                        'type': 'nodeExecutionAfter',
                        'data': {
                            'executionId': execution.id,
                            'nodeName': node.get('data', {}).get('label', node_id),
                            'error': {
                                'message': str(e)
                            }
                        }
                    }
                    
                    raise
            
            # Mark execution as completed and commit once at the end
            print(f"✅ [SSE] All nodes completed, committing final state")
            execution.status = 'completed'
            execution.completed_at = datetime.utcnow()
            execution.output_data = node_outputs
            await self.session.commit()
            
        except Exception as e:
            if execution:
                execution.status = 'failed'
                execution.error_message = str(e)
                execution.completed_at = datetime.utcnow()
                await self.session.commit()
            raise
    
    async def execute_flow(
        self, 
        flow_id: int, 
        input_data: Dict[str, Any] = None,
        conversation_id: int = None
    ) -> WorkflowExecution:
        """Execute a workflow and return execution record"""
        
        # Get flow
        flow = await self.session.get(Flow, flow_id)
        if not flow:
            raise ValueError(f"Flow {flow_id} not found")
        
        # Get nodes and edges
        nodes = flow.data.get('nodes', []) if flow.data else []
        edges = flow.data.get('edges', []) if flow.data else []
        
        # Create execution record
        execution = WorkflowExecution(
            flow_id=flow_id,  # Changed from flow_version_id
            conversation_id=conversation_id,
            status='running',
            started_at=datetime.utcnow(),
            input_data=input_data or {},
            total_nodes=len(nodes),
            completed_nodes=0
        )
        
        self.session.add(execution)
        await self.session.commit()
        await self.session.refresh(execution)
        
        try:
            # Execute workflow
            results = await self._execute_workflow(execution, nodes, edges)
            
            # Count successful and failed nodes
            completed_nodes = len([r for r in results.values() if not r.get('error')])
            failed_nodes = len([r for r in results.values() if r.get('error')])
            
            # Update execution status based on results
            if failed_nodes == 0:
                execution.status = 'completed'
            elif completed_nodes == 0:
                execution.status = 'failed'
            else:
                execution.status = 'partial'  # Some nodes succeeded, some failed
            
            execution.completed_at = datetime.utcnow()
            execution.output_data = results
            execution.completed_nodes = completed_nodes
            
        except Exception as e:
            execution.status = 'failed'
            execution.completed_at = datetime.utcnow()
            execution.error_message = str(e)
        
        self.session.add(execution)
        await self.session.commit()
        await self.session.refresh(execution)
        
        return execution
    
    async def _execute_workflow(
        self, 
        execution: WorkflowExecution,
        nodes: List[Dict],
        edges: List[Dict]
    ) -> Dict[str, Any]:
        """Execute workflow nodes in order"""
        
        # Find trigger nodes (nodes with no incoming edges)
        trigger_nodes = [
            node for node in nodes
            if not any(edge['target'] == node['id'] for edge in edges)
        ]
        
        if not trigger_nodes:
            raise ValueError("No trigger node found")
        
        execution_results = {}
        
        # Execute nodes in order (simple BFS)
        queue = trigger_nodes.copy()
        visited = set()
        
        while queue:
            current_node = queue.pop(0)
            node_id = current_node['id']
            
            if node_id in visited:
                continue
            
            visited.add(node_id)
            
            # Execute node
            result = await self._execute_node(
                execution, 
                current_node, 
                execution_results
            )
            execution_results[node_id] = result
            
            # Find next nodes
            next_edges = [e for e in edges if e['source'] == node_id]
            next_nodes = [
                n for n in nodes 
                if any(e['target'] == n['id'] for e in next_edges)
            ]
            queue.extend(next_nodes)
        
        return execution_results
    
    def _topological_sort(self, nodes: List[Dict], edges: List[Dict]) -> List[Dict]:
        """Sort nodes in execution order using topological sort"""
        # Build adjacency list
        graph = {node['id']: [] for node in nodes}
        in_degree = {node['id']: 0 for node in nodes}
        
        for edge in edges:
            source = edge.get('source')
            target = edge.get('target')
            if source and target:
                graph[source].append(target)
                in_degree[target] += 1
        
        # Find nodes with no incoming edges (start nodes)
        queue = [node_id for node_id, degree in in_degree.items() if degree == 0]
        sorted_ids = []
        
        while queue:
            node_id = queue.pop(0)
            sorted_ids.append(node_id)
            
            for neighbor in graph[node_id]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)
        
        # Return nodes in sorted order
        node_map = {node['id']: node for node in nodes}
        return [node_map[node_id] for node_id in sorted_ids if node_id in node_map]
    
    async def _execute_node(
        self,
        execution: WorkflowExecution,
        node: Dict,
        previous_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a single node and create node execution record"""
        
        node_id = node['id']
        node_data = node.get('data', {})
        node_type = node_data.get('type', '')
        node_label = node_data.get('label', node_type)
        config = node_data.get('config', {}).copy()
        
        # Merge runtime inputs
        # If input_data is structured by node_id (Dict[str, Dict]), use that
        if execution.input_data and node_id in execution.input_data:
            config.update(execution.input_data[node_id])
        # If input_data is flat and this is a trigger node, inject all inputs
        elif execution.input_data and node_type.startswith('trigger-'):
            config.update(execution.input_data)
        
        # Substitute variables in config using results from previous nodes
        config = self._substitute_variables(config, previous_results)
        
        # Create node execution record
        node_execution = NodeExecution(
            workflow_execution_id=execution.id,
            node_id=node_id,
            node_type=node_type,
            node_label=node_label,
            status='running',
            started_at=datetime.utcnow(),
            input_data=config
        )
        
        self.session.add(node_execution)
        await self.session.commit()
        
        try:
            # Execute based on node type
            result = await self._execute_node_logic(node_type, config, previous_results)
            
            # Update node execution
            node_execution.status = 'completed'
            node_execution.completed_at = datetime.utcnow()
            node_execution.output_data = result
            
            if node_execution.started_at and node_execution.completed_at:
                duration = (node_execution.completed_at - node_execution.started_at).total_seconds() * 1000
                node_execution.execution_time_ms = int(duration)
            
        except Exception as e:
            node_execution.status = 'failed'
            node_execution.completed_at = datetime.utcnow()
            node_execution.error_message = str(e)
            result = {'error': str(e)}
        
        self.session.add(node_execution)
        await self.session.commit()
        
        return result
    
    async def _execute_node_logic(
        self,
        node_type: str,
        config: Dict[str, Any],
        previous_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute node logic based on type"""
        
        # Trigger nodes
        if node_type.startswith('trigger-'):
            return {
                'triggered': True,
                'timestamp': datetime.utcnow().isoformat(),
                **config
            }
        
        # AI nodes
        if node_type == 'ai-openai':
            import httpx
            import os
            
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                return {'error': 'OpenAI API Key not configured'}
                
            model = config.get('model', 'gpt-4o')
            prompt = config.get('prompt', '')
            temperature = float(config.get('temperature', 0.7))
            max_tokens = int(config.get('max_tokens', 150))
            
            async with httpx.AsyncClient() as client:
                try:
                    response = await client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {api_key}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": model,
                            "messages": [{"role": "user", "content": prompt}],
                            "temperature": temperature,
                            "max_tokens": max_tokens
                        },
                        timeout=60.0
                    )
                    
                    if response.status_code != 200:
                        return {'error': f"OpenAI API Error: {response.text}"}
                        
                    data = response.json()
                    content = data['choices'][0]['message']['content']
                    
                    return {
                        'response': content,
                        'model': model,
                        'tokens_used': data['usage']['total_tokens']
                    }
                except Exception as e:
                    return {'error': str(e)}

        if node_type == 'ai-gemini':
            from app.services.gemini import gemini_service
            prompt = config.get('prompt', '')
            
            try:
                response = await gemini_service.generate_content(prompt)
                if not response:
                    return {'error': 'Gemini returned empty response'}
                    
                return {
                    'response': response,
                    'model': config.get('model', 'gemini-2.5-flash')
                }
            except Exception as e:
                return {'error': str(e)}

        if node_type == 'ai-classify':
            from app.services.gemini import gemini_service
            
            text = config.get('text', '') # Should ideally come from input
            categories = config.get('categories', [])
            
            if isinstance(categories, str):
                categories = [c.strip() for c in categories.split(',') if c.strip()]

            
            if not categories:
                return {'error': 'No categories provided'}
                
            prompt = f"""
            Classify the following text into one of these categories: {', '.join(categories)}.
            Text: "{text}"
            Return ONLY the category name.
            """
            
            try:
                category = await gemini_service.generate_content(prompt)
                category = category.strip() if category else "unknown"
                return {
                    'category': category,
                    'confidence': 0.9
                }
            except Exception as e:
                return {'error': str(e)}
        
        # Message nodes
        if node_type.startswith('send-'):
            platform = node_type.replace('send-', '')
            # TODO: Implement real sending logic with channel integration
            return {
                'sent': True,
                'platform': platform,
                'message': config.get('message', ''),
                'timestamp': datetime.utcnow().isoformat(),
                'note': 'Message sending simulation (Integration pending)'
            }
        
        # Media nodes
        if node_type.startswith('media-'):
            return {
                'processed': True,
                'media_url': config.get('media_url', ''),
                'type': node_type
            }
        
        # Action nodes
        if node_type == 'action-http':
            import httpx
            import json
            
            url = config.get('url')
            method = config.get('method', 'GET')
            
            # Parse headers
            headers = config.get('headers', {})
            if isinstance(headers, str):
                try:
                    headers = json.loads(headers)
                except:
                    headers = {}
            
            # Parse body
            body = config.get('body')
            json_body = None
            if isinstance(body, str) and body.strip():
                try:
                    json_body = json.loads(body)
                except:
                    pass

            if url:
                async with httpx.AsyncClient() as client:
                    try:
                        response = await client.request(
                            method, 
                            url, 
                            headers=headers, 
                            json=json_body if method in ['POST', 'PUT', 'PATCH'] else None,
                            timeout=30.0
                        )
                        
                        # Try to parse JSON response
                        try:
                            data = response.json()
                        except:
                            data = response.text
                            
                        return {
                            'executed': True,
                            'status': response.status_code,
                            'data': data
                        }
                    except Exception as e:
                         return {'error': str(e)}
            
            return {
                'executed': True,
                'url': url,
                'method': method,
                'note': 'No URL provided'
            }
        
        if node_type == 'action-code':
            code = config.get('code', '')
            if not code:
                return {'executed': False, 'reason': 'No code provided'}
            
            # Prepare context
            local_scope = {'input': previous_results}
            
            try:
                # WARNING: Executing arbitrary code is dangerous. 
                # Ensure this is only enabled in trusted environments.
                exec(code, {}, local_scope)
                
                # Filter out internal variables
                result_scope = {k:v for k,v in local_scope.items() if k != 'input' and not k.startswith('__')}
                
                return {
                    'executed': True,
                    'result': local_scope.get('result', None),
                    'scope': str(result_scope) # Convert to string to avoid serialization issues
                }
            except Exception as e:
                return {'error': str(e)}
        
        # Social posting with multi-platform support
        if node_type == 'action-post-social':
            from app.models.conversation import ChannelConnection, Channel
            from sqlmodel import select
            
            channel_ids = config.get('channel_ids', [])
            content = config.get('content', '')
            media_url = config.get('media_url')
            
            if not channel_ids:
                return {'error': 'No channels selected'}
            
            results = []
            for channel_id in channel_ids:
                try:
                    if isinstance(channel_id, str) and channel_id.isdigit():
                        channel_id = int(channel_id)
                        
                    # Get channel connection
                    connection = await self.session.get(ChannelConnection, channel_id)
                    if not connection:
                        results.append({
                            'channel_id': channel_id,
                            'status': 'error',
                            'error': 'Channel connection not found'
                        })
                        continue
                    
                    # Get channel info
                    channel = await self.session.get(Channel, connection.channel_id)
                    
                    # Post based on channel type
                    # TODO: Implement actual platform APIs
                    # For now, return simulation
                    results.append({
                        'channel_id': channel_id,
                        'channel_name': channel.name if channel else 'Unknown',
                        'platform': channel.name.lower() if channel else 'unknown',
                        'post_id': f'sim_{channel_id}_{datetime.utcnow().timestamp()}',
                        'url': f'https://{channel.name.lower()}.com/post/123',
                        'status': 'success',
                        'note': 'Simulation - Real API integration pending'
                    })
                    
                except Exception as e:
                    results.append({
                        'channel_id': channel_id,
                        'status': 'error',
                        'error': str(e)
                    })
            
            return {
                'posted': True,
                'posts': results,
                'total_channels': len(channel_ids),
                'successful': len([r for r in results if r.get('status') == 'success']),
                'failed': len([r for r in results if r.get('status') == 'error'])
            }
        
        # Send message with multi-channel support
        if node_type == 'action-send-message':
            from app.models.conversation import ChannelConnection, Channel
            
            channel_ids = config.get('channel_ids', [])
            recipient = config.get('recipient', '')
            message = config.get('message', '')
            
            if not channel_ids:
                return {'error': 'No channels selected'}
            
            results = []
            for channel_id in channel_ids:
                try:
                    if isinstance(channel_id, str) and channel_id.isdigit():
                        channel_id = int(channel_id)

                    connection = await self.session.get(ChannelConnection, channel_id)
                    if not connection:
                        results.append({
                            'channel_id': channel_id,
                            'status': 'error',
                            'error': 'Channel connection not found'
                        })
                        continue
                    
                    channel = await self.session.get(Channel, connection.channel_id)
                    
                    # TODO: Implement actual messaging APIs
                    results.append({
                        'channel_id': channel_id,
                        'channel_name': channel.name if channel else 'Unknown',
                        'platform': channel.name.lower() if channel else 'unknown',
                        'message_id': f'msg_{channel_id}_{datetime.utcnow().timestamp()}',
                        'status': 'sent',
                        'note': 'Simulation - Real API integration pending'
                    })
                    
                except Exception as e:
                    results.append({
                        'channel_id': channel_id,
                        'status': 'error',
                        'error': str(e)
                    })
            
            return {
                'sent': True,
                'messages': results,
                'total_channels': len(channel_ids),
                'successful': len([r for r in results if r.get('status') == 'sent']),
                'failed': len([r for r in results if r.get('status') == 'error'])
            }
        
        
        # Logic nodes
        if node_type == 'logic-condition':
            return {
                'evaluated': True,
                'operator': config.get('operator', 'equals'),
                'result': True
            }
            
        # Response nodes
        if node_type == 'response-webhook':
            return {
                'responded': True,
                'status': config.get('status', 200),
                'body': config.get('body', {})
            }
        
        # Default
        return {
            'executed': True,
            'node_type': node_type
        }

    def _substitute_variables(self, config: Dict[str, Any], previous_results: Dict[str, Any]) -> Dict[str, Any]:
        """Substitute variables in config with values from previous results"""
        import re
        
        def replace_match(match):
            path = match.group(1).strip()
            parts = path.split('.')
            if len(parts) < 2:
                return match.group(0)
            
            node_ref = parts[0]
            field_path = parts[1:]
            
            # Find matching node in previous_results
            # Try exact match first
            target_node_id = node_ref
            if target_node_id not in previous_results:
                # Try finding a node that starts with node_ref (e.g. 'trigger' -> 'trigger_1')
                matches = [nid for nid in previous_results.keys() if nid.startswith(node_ref)]
                if matches:
                    target_node_id = matches[0] # Take first match
            
            if target_node_id in previous_results:
                value = previous_results[target_node_id]
                for part in field_path:
                    if isinstance(value, dict) and part in value:
                        value = value[part]
                    else:
                        return match.group(0) # Path not found
                return str(value)
            
            return match.group(0)

        new_config = config.copy()
        for key, value in new_config.items():
            if isinstance(value, str):
                new_config[key] = re.sub(r'\{\{(.*?)\}\}', replace_match, value)
            elif isinstance(value, dict):
                new_config[key] = self._substitute_variables(value, previous_results)
            # Note: Lists are not recursively processed for now to keep it simple
            
        return new_config

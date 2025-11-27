# Real-time Workflow Execution with SSE

## Architecture (Following n8n Pattern)

```
┌─────────────┐         SSE Stream          ┌──────────────┐
│   Frontend  │ ←────────────────────────── │   Backend    │
│   (React)   │                             │  (FastAPI)   │
└─────────────┘                             └──────────────┘
      │                                            │
      ├─ Update node status real-time             ├─ Execute nodes sequentially
      ├─ Show loading on active node              ├─ Emit events for each node
      └─ Display results immediately              └─ Stream via SSE

Event Flow:
1. executionStarted    → Workflow begins
2. nodeExecutionBefore → Node about to run (show loading)
3. nodeExecutionAfter  → Node completed (show result/error)
4. executionFinished   → Workflow done
```

## Implementation

### 1. Backend: SSE Endpoint

**File:** `apps/backend/app/api/v1/executions_stream.py`

```python
@router.post("/stream")
async def execute_workflow_stream(request: ExecuteStreamRequest):
    return StreamingResponse(
        execution_event_stream(...),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
```

### 2. Flow Executor with Events

**File:** `apps/backend/app/services/flow_executor.py`

```python
async def execute_with_events(self, flow_id, input_data, user_id):
    # Yield events as nodes execute
    for node in sorted_nodes:
        yield {'type': 'nodeExecutionBefore', 'data': {...}}
        
        result = await execute_node(node)
        
        yield {'type': 'nodeExecutionAfter', 'data': {...}}
```

### 3. Frontend: SSE Hook

**File:** `apps/web/lib/hooks/use-execution-stream.ts`

```typescript
export function useExecutionStream(nodes, setNodes) {
    const execute = async (flowId, inputData) => {
        // Fetch with streaming
        const response = await fetch('/executions/stream', {...})
        const reader = response.body.getReader()
        
        // Read SSE stream
        while (true) {
            const {done, value} = await reader.read()
            if (done) break
            
            // Parse events and update nodes
            const event = parseSSE(value)
            updateNodeStatus(event)
        }
    }
    
    return {execute, isExecuting}
}
```

### 4. Edit Page Integration

**File:** `apps/web/app/(dashboard)/flows/[id]/edit/page.tsx`

```typescript
const {execute: executeStream, isExecuting} = useExecutionStream(nodes, setNodes)

const handleExecute = async () => {
    await executeStream(flowId, {})
}
```

## Event Types

### executionStarted
```json
{
  "type": "executionStarted",
  "data": {
    "executionId": 123,
    "mode": "manual"
  }
}
```

### nodeExecutionBefore
```json
{
  "type": "nodeExecutionBefore",
  "data": {
    "executionId": 123,
    "nodeName": "Gemini AI"
  }
}
```
**Action:** Set node status to `running`, show spinner

### nodeExecutionAfter (Success)
```json
{
  "type": "nodeExecutionAfter",
  "data": {
    "executionId": 123,
    "nodeName": "Gemini AI",
    "data": {
      "response": "Hello world",
      "model": "gemini-2.5-flash"
    }
  }
}
```
**Action:** Set node status to `success`, show checkmark

### nodeExecutionAfter (Error)
```json
{
  "type": "nodeExecutionAfter",
  "data": {
    "executionId": 123,
    "nodeName": "Gemini AI",
    "error": {
      "message": "API key not configured"
    }
  }
}
```
**Action:** Set node status to `error`, show X icon

### executionFinished
```json
{
  "type": "executionFinished",
  "data": {
    "finishedAt": "2025-11-26T10:30:00Z"
  }
}
```

## Benefits

✅ **Real-time feedback**: See each node execute live
✅ **Industry standard**: Following n8n/Zapier pattern
✅ **HTTP-based**: No WebSocket complexity
✅ **Auto-reconnect**: Browser handles reconnection
✅ **Scalable**: Works with load balancers
✅ **Debug friendly**: Can see exactly where it fails
✅ **Professional UX**: Like n8n, Make.com, Zapier

## Comparison

### Before (Batch)
```
Click Run → Wait... → All nodes show result at once
```
❌ No feedback during execution
❌ Can't see which node is running
❌ Feels slow even if fast

### After (SSE Streaming)
```
Click Run → Node 1 running... → Node 1 done ✓
         → Node 2 running... → Node 2 done ✓
         → Node 3 running... → Node 3 done ✓
```
✅ Immediate feedback
✅ See progress in real-time
✅ Feels fast and responsive

## Technical Details

### SSE Format
```
data: {"type":"nodeExecutionBefore","data":{...}}\n\n
data: {"type":"nodeExecutionAfter","data":{...}}\n\n
```

### Why SSE over WebSocket?
- ✅ Simpler (HTTP-based)
- ✅ Auto-reconnect built-in
- ✅ Works with HTTP/2
- ✅ No connection management
- ✅ Easier to debug
- ✅ Better for one-way streaming

### Performance
- Small delay (10ms) between events to prevent overwhelming
- Efficient JSON streaming
- No polling overhead
- Minimal memory footprint

## Future Enhancements

- [ ] Pause/Resume execution
- [ ] Cancel execution mid-way
- [ ] Execution progress percentage
- [ ] Estimated time remaining
- [ ] Parallel node execution
- [ ] Retry failed nodes

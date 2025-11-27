# SSE Debug Guide

## Current Issue
SSE endpoint chờ toàn bộ workflow execute xong mới trả về, thay vì stream real-time.

## Debug Steps

### 1. Check Backend Logs
```bash
# Terminal 1: Start backend with logs
cd apps/backend
uvicorn app.main:app --reload --log-level debug

# Watch for these logs:
# 📡 [SSE] Starting event stream for flow_id=83
# 🔵 [SSE] Yielding nodeExecutionBefore for: Manual Trigger
# ⚙️ [SSE] Executing node: Manual Trigger
# ✅ [SSE] Node completed: Manual Trigger
# 🟢 [SSE] Yielding nodeExecutionAfter for: Manual Trigger
# 📤 [SSE] Sending event: nodeExecutionBefore
# 📤 [SSE] Sending event: nodeExecutionAfter
```

### 2. Test with curl
```bash
curl -N -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"flow_id": 83, "input_data": {}}' \
  http://localhost:8000/api/v1/executions/stream

# Should see events streaming immediately:
data: {"type":"executionStarted",...}

data: {"type":"nodeExecutionBefore",...}

data: {"type":"nodeExecutionAfter",...}
```

### 3. Check Frontend Console
Open browser console (F12) and look for:
```
🚀 Starting SSE execution: {flowId: 83, ...}
📡 Response status: 200 OK
📖 Starting to read SSE stream...
📨 Received chunk: data: {"type":"executionStarted"...
📬 Event #1: executionStarted {...}
⏳ Node starting: Manual Trigger
```

### 4. Test Page
Navigate to: `http://localhost:3000/test-sse`
- Click "Test SSE Execution"
- Watch logs in real-time

## Common Issues

### Issue 1: Events Buffered
**Symptom:** All events arrive at once after workflow completes

**Cause:** 
- Nginx/proxy buffering
- Python buffering
- Database commits blocking

**Fix:**
```python
# In executions_stream.py
headers={
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",  # ← Disable nginx buffering
}

# Force flush after each yield
await asyncio.sleep(0)
```

### Issue 2: Database Blocking
**Symptom:** Long pause between events

**Cause:** `await self.session.commit()` blocks

**Fix:**
```python
# Option 1: Commit less frequently
# Only commit after all nodes complete

# Option 2: Use separate session for streaming
# Don't commit in the loop

# Option 3: Use background task for DB writes
asyncio.create_task(self.session.commit())
```

### Issue 3: Frontend Not Updating
**Symptom:** Console shows events but UI doesn't update

**Cause:** Node name mismatch

**Fix:**
```typescript
// In use-execution-stream.ts
const updateNodeStatus = (nodeName: string, status) => {
    setNodes((nds) =>
        nds.map((node) => {
            const nodeLabel = node.data?.label || node.id
            console.log(`Comparing: "${nodeLabel}" === "${nodeName}"`)
            if (nodeLabel === nodeName || node.id === nodeName) {
                return {...node, data: {...node.data, executionStatus: status}}
            }
            return node
        })
    )
}
```

## Quick Fix: Remove Database Commits

If SSE still buffers, try removing commits from the loop:

```python
# In flow_executor.py execute_with_events()
for node in sorted_nodes:
    yield {'type': 'nodeExecutionBefore', ...}
    
    output = await self._execute_node(execution, node, node_outputs)
    # ❌ Remove this: await self.session.commit()
    
    yield {'type': 'nodeExecutionAfter', ...}

# ✅ Commit once at the end
await self.session.commit()
```

## Verify SSE is Working

### Test 1: Immediate Response
```bash
time curl -N ... /executions/stream

# Should start streaming within 100ms
# Not wait for full execution
```

### Test 2: Incremental Events
```bash
curl -N ... /executions/stream | while read line; do
    echo "[$(date +%H:%M:%S)] $line"
done

# Should see timestamps spread out:
# [15:30:01] data: {"type":"executionStarted"...}
# [15:30:02] data: {"type":"nodeExecutionBefore"...}
# [15:30:05] data: {"type":"nodeExecutionAfter"...}
# [15:30:06] data: {"type":"nodeExecutionBefore"...}
```

### Test 3: Browser Network Tab
1. Open DevTools → Network
2. Click "Run" workflow
3. Find `/executions/stream` request
4. Should see "EventStream" type
5. Response should show incremental data

## Expected Timeline

For a 3-node workflow (Manual → Gemini → Return):

```
T+0ms:   executionStarted
T+10ms:  nodeExecutionBefore (Manual Trigger)
T+50ms:  nodeExecutionAfter (Manual Trigger)
T+60ms:  nodeExecutionBefore (Gemini)
T+3000ms: nodeExecutionAfter (Gemini)  ← AI call takes time
T+3010ms: nodeExecutionBefore (Return Data)
T+3020ms: nodeExecutionAfter (Return Data)
T+3030ms: executionFinished
```

**Total:** ~3 seconds with 7 events streaming in real-time

## Success Criteria

✅ Events stream immediately (not buffered)
✅ Frontend updates node status in real-time
✅ Console logs show incremental events
✅ UI shows spinner → checkmark progression
✅ No long pauses between events

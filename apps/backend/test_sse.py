"""
Quick test script for SSE execution
"""
import asyncio
import sys
sys.path.insert(0, '.')

from app.api.v1.executions_stream import execution_event_stream


async def test_sse():
    """Test SSE event generation"""
    print("Testing SSE event stream...")
    print("-" * 50)
    
    # Mock data
    flow_id = 1
    input_data = {"message": "test"}
    user_id = "test_user"
    
    try:
        event_count = 0
        async for event in execution_event_stream(flow_id, input_data, user_id):
            event_count += 1
            print(f"Event {event_count}:")
            print(event)
            print()
            
            # Limit to first 5 events for testing
            if event_count >= 5:
                break
                
        print(f"✓ Successfully generated {event_count} events")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_sse())

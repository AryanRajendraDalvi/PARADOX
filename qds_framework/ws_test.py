import asyncio
import websockets
import json
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(message)s')

async def client_task(client_id, uri, event_list, stop_event, disconnect_after=None, start_delay=None):
    logger = logging.getLogger(f"Client-{client_id}")
    if start_delay:
        await asyncio.sleep(start_delay)
        
    try:
        async with websockets.connect(uri) as websocket:
            logger.info("Connected.")
            
            # Client 1 does the driving
            if client_id == 1:
                # 1. Initial run
                logger.info("Sending START attack=none")
                await websocket.send(json.dumps({"command": "START", "attack": "none"}))
                
                # 2. Rapid switching loop
                asyncio.create_task(rapid_switch_routine(websocket, logger))
            
            start_time = asyncio.get_event_loop().time()
            
            while not stop_event.is_set():
                if disconnect_after and (asyncio.get_event_loop().time() - start_time) > disconnect_after:
                    logger.info("Simulating mid-stream disconnect.")
                    break
                    
                try:
                    message = await asyncio.wait_for(websocket.recv(), timeout=0.1)
                    data = json.loads(message)
                    
                    if data.get("type") == "ROUND_UPDATE":
                        attack_type = data["attack"]["type"]
                        session_id = data.get("session_id", "unknown")
                        event_list.append((client_id, data["round_id"], attack_type, session_id))
                        
                except asyncio.TimeoutError:
                    continue
                except websockets.exceptions.ConnectionClosed:
                    break
    except Exception as e:
        logger.error(f"Error: {e}")
        
async def rapid_switch_routine(websocket, logger):
    await asyncio.sleep(1.0)
    logger.info("Starting rapid switch test...")
    for attack in ["intercept", "entangle", "replay", "batchNoise", "blind"]:
        logger.info(f"Rapid switch -> {attack}")
        await websocket.send(json.dumps({"command": "START", "attack": attack}))
        await asyncio.sleep(0.2) # 200ms tight loop
        
    # Final stable run
    logger.info("Rapid switch done. Sending final START attack=intercept")
    await websocket.send(json.dumps({"command": "START", "attack": "intercept"}))

def check_overlaps(events_list, client_id):
    # Check that for any given session_id, the round_ids strictly increase, 
    # and we never see an old session_id after seeing a new one.
    if not events_list:
        return True
        
    seen_sessions = []
    current_session = None
    last_round = -1
    overlap_detected = False
    
    for _, round_id, attack, session_id in events_list:
        if session_id != current_session:
            if session_id in seen_sessions:
                print(f"FAIL [Client {client_id}]: Zombie stream! Received old session_id {session_id} after it was already replaced.")
                overlap_detected = True
            seen_sessions.append(session_id)
            current_session = session_id
            last_round = -1
            
        if round_id <= last_round:
            print(f"FAIL [Client {client_id}]: Duplicate or out-of-order round_id {round_id} in session {session_id}")
            overlap_detected = True
            
        last_round = round_id
        
    if not overlap_detected:
        print(f"PASS [Client {client_id}]: Stream strictly monotonic. No overlaps or zombies.")
    return not overlap_detected

async def main():
    uri = "ws://localhost:8765"
    events = []
    stop_event = asyncio.Event()
    
    # Start the clients
    tasks = [
        asyncio.create_task(client_task(1, uri, events, stop_event)),
        asyncio.create_task(client_task(2, uri, events, stop_event)),
        asyncio.create_task(client_task(3, uri, events, stop_event)),
        # Client 4: Disconnects mid-stream (after 2 seconds)
        asyncio.create_task(client_task(4, uri, events, stop_event, disconnect_after=2.0)),
        # Client 5: Connects late (after 3 seconds)
        asyncio.create_task(client_task(5, uri, events, stop_event, start_delay=3.0))
    ]
    
    # Run for a total of 6 seconds to let the rapid switches finish and the final stream run for a bit
    await asyncio.sleep(6.0)
    stop_event.set()
    await asyncio.gather(*tasks)
    
    # Analyze
    c1_events = [e for e in events if e[0] == 1]
    c2_events = [e for e in events if e[0] == 2]
    c3_events = [e for e in events if e[0] == 3]
    c4_events = [e for e in events if e[0] == 4]
    c5_events = [e for e in events if e[0] == 5]
    
    print(f"\n--- Analysis ---")
    print(f"Total events received: C1: {len(c1_events)}, C2: {len(c2_events)}, C3: {len(c3_events)}, C4 (early disconnect): {len(c4_events)}, C5 (late join): {len(c5_events)}")
    
    # Sync check for persistent clients
    if len(c1_events) > 0 and len(c1_events) == len(c2_events) and len(c2_events) == len(c3_events):
        print("PASS: Broadcast is perfectly synchronized across persistent clients.")
    else:
        print("FAIL: Persistent clients received different numbers of events.")
        
    if len(c4_events) > 0 and len(c4_events) < len(c1_events):
        print("PASS: Early disconnect client smoothly exited and collected partial events.")
    else:
        print("FAIL: Early disconnect behavior unexpected.")
        
    if len(c5_events) > 0 and len(c5_events) < len(c1_events):
        print("PASS: Late joining client smoothly entered and collected partial events.")
    else:
        print("FAIL: Late join behavior unexpected.")
        
    # Check all clients for overlap/zombie streams
    all_clean = True
    for c_id, c_events in zip([1,2,3,4,5], [c1_events, c2_events, c3_events, c4_events, c5_events]):
        if not check_overlaps(c_events, c_id):
            all_clean = False
            
    if all_clean:
        print("PASS: All streams (persistent, disconnecting, and late-joining) are completely clean of zombies.")
        
    # Verify session_id presence
    if c1_events and c1_events[0][3] != "unknown":
        print("PASS: session_id correctly injected into events.")
    else:
        print("FAIL: session_id missing from events.")

if __name__ == "__main__":
    asyncio.run(main())
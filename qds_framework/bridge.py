import asyncio
import websockets
import json
import subprocess
import argparse
import sys
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

import uuid

connected_clients = set()
current_task = None
current_process = None
current_session_id = None

async def register(websocket):
    connected_clients.add(websocket)
    logging.info(f"New client connected. Total clients: {len(connected_clients)}")
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                if data.get("command") == "START":
                    attack_type = data.get("attack", "none")
                    global current_task, current_session_id
                    current_session_id = str(uuid.uuid4())
                    
                    if current_task and not current_task.done():
                        current_task.cancel()
                    current_task = asyncio.create_task(run_simulator_and_stream(attack_type))
                elif data.get("command") == "STOP":
                    if current_task and not current_task.done():
                        current_task.cancel()
            except json.JSONDecodeError:
                pass
    finally:
        connected_clients.remove(websocket)
        logging.info(f"Client disconnected. Total clients: {len(connected_clients)}")

async def broadcast_events(process, delay_ms):
    try:
        while True:
            line = await process.stdout.readline()
            if not line:
                break
                
            line_text = line.decode('utf-8').strip()
            if not line_text.startswith('{'):
                logging.info(f"Simulator Log: {line_text}")
                continue
                
            try:
                event = json.loads(line_text)
                if current_session_id:
                    event["session_id"] = current_session_id
                
                # Convert back to string for broadcast
                out_text = json.dumps(event)
                
                if connected_clients:
                    websockets.broadcast(connected_clients, out_text)
                await asyncio.sleep(delay_ms / 1000.0)
            except json.JSONDecodeError:
                logging.warning(f"Could not parse simulator output as JSON: {line_text}")
    except asyncio.CancelledError:
        raise # Reraise so run_simulator_and_stream can terminate the process

async def run_simulator_and_stream(attack_type):
    global current_process
    
    # If a simulation is already running, kill it
    if current_process and current_process.returncode is None:
        current_process.terminate()
        # We don't await here to avoid getting stuck if the old process is wedged.
        # It's fine, terminate() sends SIGTERM immediately.

    cmd = [
        global_args.executable,
        "--rounds", str(global_args.rounds),
        "--batch-depth", str(global_args.batch_depth),
        "--delta", str(global_args.delta),
        "--noise", str(global_args.noise),
        "--seed", str(global_args.seed),
        "--attack", attack_type
    ]
    
    logging.info(f"Starting QDS simulator: {' '.join(cmd)}")
    
    try:
        current_process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        await broadcast_events(current_process, global_args.delay)
        await current_process.wait()
        
        logging.info(f"Simulator finished with exit code {current_process.returncode}.")
        
        term_event = json.dumps({"type": "SIMULATION_COMPLETE", "exit_code": current_process.returncode})
        if connected_clients:
            websockets.broadcast(connected_clients, term_event)
            
    finally:
        if current_process and current_process.returncode is None:
            logging.info("Stream ended or cancelled. Terminating subprocess...")
            current_process.terminate()

async def main():
    global global_args
    parser = argparse.ArgumentParser(description="QDS Framework WebSocket Bridge")
    parser.add_argument("--executable", type=str, default="./qds_sim.exe", help="Path to the C++ simulator")
    parser.add_argument("--port", type=int, default=8765, help="WebSocket server port")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="WebSocket server host")
    parser.add_argument("--rounds", type=int, default=1000, help="Number of rounds to simulate")
    parser.add_argument("--batch-depth", type=int, default=10, help="CEFB batch depth")
    parser.add_argument("--delta", type=float, default=0.01, help="Statistical threshold delta")
    parser.add_argument("--noise", type=float, default=0.0, help="Honest channel noise (p0)")
    parser.add_argument("--seed", type=int, default=42, help="RNG seed")
    parser.add_argument("--delay", type=int, default=10, help="Artificial delay between events in ms")
    
    global_args = parser.parse_args()
    
    logging.info(f"Starting WebSocket server on ws://{global_args.host}:{global_args.port}")
    logging.info("Waiting for clients to connect and send a {'command': 'START'} message...")
    
    async with websockets.serve(register, global_args.host, global_args.port):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    try:
        import websockets
    except ImportError:
        print("Error: The 'websockets' library is missing.")
        sys.exit(1)
        
    asyncio.run(main())
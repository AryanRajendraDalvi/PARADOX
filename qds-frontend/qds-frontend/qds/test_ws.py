import asyncio
import websockets
import json
import uuid

async def test():
    uri = "ws://localhost:4000"
    
    # Alice sends a message to Charlie
    async with websockets.connect(uri) as alice_ws:
        await alice_ws.send(json.dumps({'type': 'IDENTIFY', 'token': 'alice123'}))
        await alice_ws.send(json.dumps({'command': 'MESSAGE_SEND', 'to_user_id': 'charlie', 'text': 'Hello Charlie', 'client_id': 'alice-1'}))
        ack = await alice_ws.recv()
        msg_data = json.loads(ack)
        if msg_data.get('type') != 'MESSAGE_ACK':
            ack = await alice_ws.recv()
            msg_data = json.loads(ack)
        msg_id = msg_data['message']['id']
        print("Alice sent message:", msg_id)

    # Bob (verifier) connects and transmits share
    async with websockets.connect(uri) as bob_ws:
        await bob_ws.send(json.dumps({'type': 'IDENTIFY', 'token': 'bob123'}))
        # wait for initial messages
        await bob_ws.send(json.dumps({'command': 'TRANSMIT_SHARE', 'message_id': msg_id}))
        print("Bob transmitted share")
        
        # wait for MESSAGE_UPDATE
        while True:
            resp = await bob_ws.recv()
            data = json.loads(resp)
            if data.get('type') == 'MESSAGE_UPDATE':
                print("Received MESSAGE_UPDATE:", data)
                break

asyncio.run(test())
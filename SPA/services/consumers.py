import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from services.models import Booking, ChatRoom, Message


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        user_id = text_data_json['user_id']

        # Get user
        user = await User.objects.aget(id=user_id)

        # Get or create chat room
        room = await ChatRoom.objects.aget(id=self.room_name)

        # Save message
        msg = await Message.objects.acreate(
            chat_room=room,
            sender=user,
            content=message
        )

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'user_id': user_id,
                'username': user.username,
                'timestamp': msg.timestamp.isoformat()
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']
        user_id = event['user_id']
        username = event['username']
        timestamp = event['timestamp']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'user_id': user_id,
            'username': username,
            'timestamp': timestamp
        }))


class BookingSlotsConsumer(AsyncWebsocketConsumer):
    group_name = "booking_slots"

    async def connect(self):
        if not self.scope["user"].is_authenticated:
            await self.close()
            return
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data or "{}")
        selected_date = data.get("date")
        if not selected_date:
            return
        slots = await self.get_booked_slots(selected_date)
        await self.send(text_data=json.dumps({
            "type": "slots_update",
            "date": selected_date,
            "slots": slots,
        }))

    async def slots_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "slots_update",
            "date": event["date"],
            "slots": event["slots"],
        }))

    @database_sync_to_async
    def get_booked_slots(self, selected_date):
        return [
            booking.booking_time.strftime("%H:%M")
            for booking in Booking.objects.filter(booking_date=selected_date).exclude(status="Đã Hủy")
        ]

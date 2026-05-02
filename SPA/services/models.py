from django.conf import settings
from django.db import models
from django.utils.text import slugify
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User

class Service(models.Model):
    CATEGORY_FACE = "face"
    CATEGORY_BODY = "body"
    CATEGORY_HAIR = "hair"

    CATEGORY_CHOICES = [
        (CATEGORY_FACE, "Da mặt"),
        (CATEGORY_BODY, "Body"),
        (CATEGORY_HAIR, "Triệt lông"),
    ]

    STATUS_ACTIVE = "active"
    STATUS_INACTIVE = "inactive"

    STATUS_CHOICES = [
        (STATUS_ACTIVE, "Hoạt động"),
        (STATUS_INACTIVE, "Tạm dừng"),
    ]

    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    short_description = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    duration_minutes = models.PositiveIntegerField()
    price = models.PositiveIntegerField()
    rating = models.DecimalField(max_digits=2, decimal_places=1, default=4.5)
    image_url = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_order", "id"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class CustomerProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="customer_profile")
    full_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    address = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    loyalty_points = models.PositiveIntegerField(default=0)
    avatar_url = models.URLField(blank=True)
    member_since = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["user__username"]

    def __str__(self):
        return self.display_name

    @property
    def display_name(self):
        if self.full_name:
            return self.full_name
        fallback = f"{self.user.last_name} {self.user.first_name}".strip()
        return fallback or self.user.username


class ChatRoom(models.Model):
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_rooms')
    manager = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_chats')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"Chat: {self.customer.username} - {self.manager.username if self.manager else 'Unassigned'}"


class Message(models.Model):
    chat_room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"Message from {self.sender.username}: {self.content[:50]}"

class Review(models.Model):
    TYPE_CHOICES = (
        ('service', 'Đánh giá Dịch vụ'),
        ('shop', 'Đánh giá Spa'),
    )
    name = models.CharField(max_length=100)
    review_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='service')
    service = models.CharField(max_length=100, blank=True, null=True) # Tên dịch vụ (VD: Chăm sóc da)
    rating = models.IntegerField(default=5)
    content = models.TextField()
    time = models.DateTimeField(default=timezone.now)
    # Giả sử mày lưu link ảnh bằng JSON hoặc một trường Text
    image_urls = models.JSONField(blank=True, null=True)

    def __str__(self):
        return self.name


class Booking(models.Model):
    STATUS_CHOICES = (
        ('Đang Xử Lý', 'Đang Xử Lý'),
        ('Hoàn Thành', 'Hoàn Thành'),
        ('Đã Hủy', 'Đã Hủy'),
    )

    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True)

    # Thông tin chi tiết gói
    package_name = models.CharField(max_length=100, default="Gói tiêu chuẩn")
    sessions = models.CharField(max_length=50, default="1 buổi")
    package_description = models.TextField(blank=True, null=True)

    # Thời gian hẹn & Giá
    booking_date = models.DateField()
    booking_time = models.TimeField()
    total_price = models.IntegerField(default=0)

    # Ghi chú của khách
    notes = models.TextField(blank=True, null=True)

    # Trạng thái & Thời gian tạo đơn (Cực kỳ quan trọng để tính 24h hủy đơn)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Đang Xử Lý')
    created_at = models.DateTimeField(auto_now_add=True)  # Tự động lưu giờ khách bấm đặt

    def __str__(self):
        return f"{self.customer.username} - {self.service.name if self.service else 'Dịch vụ'} - {self.booking_date}"
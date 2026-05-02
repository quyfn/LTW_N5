from datetime import date

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from services.models import CustomerProfile, Service


SERVICE_SEED = [
    {
        "name": "Chăm sóc da mặt Collagen",
        "slug": "cham-soc-da-mat-collagen",
        "short_description": "Làm sạch sâu, dưỡng ẩm và tái tạo da.",
        "description": "Liệu trình chăm sóc da mặt chuyên sâu kết hợp collagen giúp phục hồi độ ẩm và cải thiện độ đàn hồi.",
        "category": Service.CATEGORY_FACE,
        "duration_minutes": 90,
        "price": 1200000,
        "rating": "4.8",
        "image_url": "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80",
        "status": Service.STATUS_ACTIVE,
        "display_order": 1,
    },
    {
        "name": "Trị mụn chuyên sâu",
        "slug": "tri-mun-chuyen-sau",
        "short_description": "Điều trị mụn an toàn, hiệu quả.",
        "description": "Liệu trình làm sạch, hút bã nhờn, lấy nhân mụn và phục hồi hàng rào bảo vệ da.",
        "category": Service.CATEGORY_FACE,
        "duration_minutes": 60,
        "price": 800000,
        "rating": "4.5",
        "image_url": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80",
        "status": Service.STATUS_ACTIVE,
        "display_order": 2,
    },
    {
        "name": "Massage body thư giãn",
        "slug": "massage-body-thu-gian",
        "short_description": "Massage toàn thân giúp thư giãn.",
        "description": "Gói massage body với tinh dầu thiên nhiên, giải tỏa căng thẳng và giảm mỏi vai gáy.",
        "category": Service.CATEGORY_BODY,
        "duration_minutes": 60,
        "price": 500000,
        "rating": "4.6",
        "image_url": "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1200&q=80",
        "status": Service.STATUS_ACTIVE,
        "display_order": 3,
    },
    {
        "name": "Triệt lông laser IPL",
        "slug": "triet-long-laser-ipl",
        "short_description": "Công nghệ triệt lông hiện đại, an toàn.",
        "description": "Công nghệ IPL giúp giảm lông mọc lại và tối ưu trải nghiệm điều trị.",
        "category": Service.CATEGORY_HAIR,
        "duration_minutes": 90,
        "price": 2000000,
        "rating": "4.8",
        "image_url": "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=1200&q=80",
        "status": Service.STATUS_ACTIVE,
        "display_order": 4,
    },
    {
        "name": "Gội đầu dưỡng sinh",
        "slug": "goi-dau-duong-sinh",
        "short_description": "Làm sạch da đầu và thư giãn.",
        "description": "Liệu trình kết hợp massage da đầu giúp giảm căng thẳng và chăm sóc tóc.",
        "category": Service.CATEGORY_BODY,
        "duration_minutes": 45,
        "price": 300000,
        "rating": "4.7",
        "image_url": "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80",
        "status": Service.STATUS_ACTIVE,
        "display_order": 5,
    },
    {
        "name": "Xông hơi sauna",
        "slug": "xong-hoi-sauna",
        "short_description": "Gian nở lỗ chân lông và đào thải độc tố.",
        "description": "Xông hơi kết hợp hương liệu giúp thư giãn cơ bắp và đào thải độc tố cho cơ thể.",
        "category": Service.CATEGORY_BODY,
        "duration_minutes": 90,
        "price": 700000,
        "rating": "4.9",
        "image_url": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80",
        "status": Service.STATUS_ACTIVE,
        "display_order": 6,
    },
    {
        "name": "Acne Detox Therapy",
        "slug": "acne-detox-therapy",
        "short_description": "Thanh lọc da mụn, làm sạch sâu lỗ chân lông.",
        "description": "Liệu trình thanh lọc da mụn chuyên sâu, loại bỏ tạp chất và cân bằng dầu nhờn.",
        "category": Service.CATEGORY_FACE,
        "duration_minutes": 75,
        "price": 950000,
        "rating": "4.6",
        "image_url": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80",
        "status": Service.STATUS_ACTIVE,
        "display_order": 7,
    },
    {
        "name": "Post-Acne Recovery Therapy",
        "slug": "post-acne-recovery-therapy",
        "short_description": "Phục hồi da sau mụn, giảm thâm sẹo.",
        "description": "Liệu trình phục hồi da sau mụn, giảm thâm nám và tái tạo tế bào da mới.",
        "category": Service.CATEGORY_FACE,
        "duration_minutes": 90,
        "price": 1200000,
        "rating": "4.7",
        "image_url": "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1200&q=80",
        "status": Service.STATUS_ACTIVE,
        "display_order": 8,
    },
]


USER_SEED = [
    {
        "username": "manager",
        "email": "manager@example.com",
        "password": "pass12345",
        "first_name": "Quản lý",
        "last_name": "Mai Trâm",
        "is_staff": True,
        "is_superuser": False,
    },
    {
        "username": "customer",
        "email": "customer@example.com",
        "password": "pass12345",
        "first_name": "Khách",
        "last_name": "Hàng",
        "is_staff": False,
        "is_superuser": False,
    },
]


class Command(BaseCommand):
    help = "Seed demo users, customer profile, and services data (idempotent)."

    def handle(self, *args, **options):
        created_services = 0
        for payload in SERVICE_SEED:
            service, created = Service.objects.update_or_create(
                slug=payload["slug"], defaults=payload
            )
            if created:
                created_services += 1
            self.stdout.write(f"Service OK: {service.name}")

        for payload in USER_SEED:
            user_payload = payload.copy()
            password = user_payload.pop("password")
            user, _ = User.objects.update_or_create(
                username=user_payload["username"], defaults=user_payload
            )
            user.set_password(password)
            user.save()

            if not user.is_staff:
                CustomerProfile.objects.update_or_create(
                    user=user,
                    defaults={
                        "full_name": f"{user.last_name} {user.first_name}".strip(),
                        "member_since": date.today(),
                        "loyalty_points": 120,
                        "phone": "0901234567",
                        "address": "Da Nang",
                    },
                )

            self.stdout.write(
                f"User OK: {user.email} (staff={user.is_staff})"
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Seed completed. Services: {Service.objects.count()} total ({created_services} new)."
            )
        )

from django.contrib import admin

from .models import CustomerProfile, Review, Service


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price", "status", "display_order")
    list_filter = ("category", "status")
    search_fields = ("name", "short_description", "description")
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("display_order", "id")


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ("display_name", "phone", "loyalty_points", "member_since")
    search_fields = ("full_name", "user__username", "user__email", "phone")


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("name", "service", "rating", "status", "time")
    list_filter = ("rating", "status", "review_type")
    search_fields = ("name", "service", "content", "customer__username", "customer__email")
    ordering = ("-time",)

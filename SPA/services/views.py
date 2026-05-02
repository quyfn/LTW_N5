from django.shortcuts import render
from django.db.models import Count, Avg
from .models import Review


def public_reviews(request):
    reviews = Review.objects.all().order_by('-time')
    total_reviews = reviews.count()

    average_rating = 0.0
    if total_reviews > 0:
        avg = reviews.aggregate(Avg('rating'))['rating__avg']
        average_rating = round(avg, 1) if avg else 0.0

    stars = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
    star_counts = reviews.values('rating').annotate(count=Count('rating'))
    for item in star_counts:
        if item['rating'] in stars:
            stars[item['rating']] = item['count']

    def get_percent(count, total):
        return round((count / total) * 100) if total > 0 else 0

    context = {
        'reviews': reviews,
        'total_reviews': total_reviews,
        'average_rating': average_rating,
        'with_images': reviews.exclude(image_urls__isnull=True).exclude(image_urls=[]).count(),
        'star_5_count': stars[5], 'star_5_percent': get_percent(stars[5], total_reviews),
        'star_4_count': stars[4], 'star_4_percent': get_percent(stars[4], total_reviews),
        'star_3_count': stars[3], 'star_3_percent': get_percent(stars[3], total_reviews),
        'star_2_count': stars[2], 'star_2_percent': get_percent(stars[2], total_reviews),
        'star_1_count': stars[1], 'star_1_percent': get_percent(stars[1], total_reviews),
    }
    return render(request, 'public_reviews.html', context)
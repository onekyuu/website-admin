from django.urls import path
from api.contact.views import ContactView

urlpatterns = [
    path('contact/', ContactView.as_view(), name='contact-form'),
]

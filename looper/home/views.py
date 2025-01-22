from django.shortcuts import render, redirect
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.contrib import messages
from .models import Route
from sign_in_out.models import UserProfile
from sign_in_out.forms import UserForm, UserProfileForm
from .serializers import RouteSerializer
import json

# Create your views here.

@login_required(login_url="/login")
def home(request):
    return render(request, 'home/home.html')

@api_view(['GET'])
def saved_routes_api(request):
    routes = Route.objects.filter(user=request.user)
    serializer = RouteSerializer(routes, many=True)
    return Response(serializer.data)

@login_required(login_url="/login")
def saved_routes(request):
    return render(request, 'home/saved_routes.html')

def save_route(request):
    data = json.loads(request.body)
    print(data["waypoints"])
    print(data["test"])
    route = Route(
        user=request.user,
        waypoints = data['waypoints']
    )
    print(route)
    route.save()
    return JsonResponse({'status': 'success'})

def delete_route(request):
    data = json.loads(request.body)
    print(data['routeId'])
    route = Route.objects.get(id=data['routeId'])
    route.delete()
    return JsonResponse({'status': 'success'})

@login_required(login_url="/login")
def profile_settings(request):
    user_profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    if request.method == 'POST':
        user_form = UserForm(request.POST, instance=request.user)
        profile_form = UserProfileForm(request.POST, instance=user_profile)
        
        if user_form.is_valid() and profile_form.is_valid():
            user_form.save()
            profile_form.save()
            messages.success(request, 'Profile updated successfully')
    else:
        user_form = UserForm(instance=request.user)
        profile_form = UserProfileForm(instance=user_profile)

    return render(request, 'home/profile.html', {
        'user_profile': user_profile
    })
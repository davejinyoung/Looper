from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .models import Route
from .serializers import RouteSerializer
import json

# Create your views here.

@login_required(login_url="/login")
def home(request):
    return render(request, 'home/home.html')

@login_required(login_url="/login")
def profile(request):
    return render(request, 'home/profile.html')

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

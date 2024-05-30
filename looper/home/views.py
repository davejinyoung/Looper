from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .models import Route
import json

# Create your views here.

@login_required(login_url="/login")
def home(request):
    return render(request, 'home/home.html')


@login_required(login_url="/login")
def saved_routes(request):
    return render(request, 'home/saved_routes.html')

def save_route(request):
    data = json.loads(request.body)
    print(data["waypoints"])
    print(data["test"])
    # route = Route(
    #     start_point = data['start_point'],
    #     end_point = data['end_point'],
    #     total_distance = data['total_distance'],
    #     total_time = data['total_time']
    # )
    # print(route)
    # route.save()
    return JsonResponse({'status': 'success'})

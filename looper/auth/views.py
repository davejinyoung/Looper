from django.http import HttpResponse


def signup(request):
    return HttpResponse("<h1>The Sign-Up Page</h1>")

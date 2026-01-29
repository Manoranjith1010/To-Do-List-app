from django.shortcuts import render
from django.http import JsonResponse
from .models import Task
import json

def index(request):
    tasks = Task.objects.all().order_by('-created_at')
    return render(request, 'todo/index.html', {'tasks': tasks})

def add_task(request):
    if request.method == "POST":
        task_name = request.POST.get("task")
        if task_name:
            Task.objects.create(name=task_name)
        return redirect("/")  # redirect after POST
    return render(request, "todo/index.html")

    
def toggle_task(request, task_id):
    if request.method == 'POST':
        task = Task.objects.get(id=task_id)
        task.completed = not task.completed
        task.save()
        return JsonResponse({'completed': task.completed})
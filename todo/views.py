from django.shortcuts import render
from django.http import JsonResponse
from .models import Task
import json

def index(request):
    tasks = Task.objects.all().order_by('-created_at')
    return render(request, 'todo/index.html', {'tasks': tasks})

def add_task(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        task = Task.objects.create(title=data['title'])
        return JsonResponse({'id': task.id, 'title': task.title, 'completed': task.completed})

def toggle_task(request, task_id):
    if request.method == 'POST':
        task = Task.objects.get(id=task_id)
        task.completed = not task.completed
        task.save()
        return JsonResponse({'completed': task.completed})
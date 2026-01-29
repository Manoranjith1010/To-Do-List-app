from django.db import models

# Create your models here.
class todo(models.model):
    title = models.CharField(max_length=200)
    description = models.TextField(max_length=500)
    completed = models.BooleanField(default=False)


    def __str__(sllef):
        return sllef.title

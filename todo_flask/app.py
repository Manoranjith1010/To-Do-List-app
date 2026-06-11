from flask import Flask, render_template, request, redirect, url_for
import os

app = Flask(__name__)
TASKS_FILE = os.path.join(os.path.dirname(__file__), "tasks.txt")


def read_tasks():
    if not os.path.exists(TASKS_FILE):
        return []
    with open(TASKS_FILE, "r", encoding="utf-8") as f:
        tasks = [line.strip() for line in f.readlines() if line.strip()]
    return tasks


def write_tasks(tasks):
    with open(TASKS_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(tasks))


@app.route("/", methods=["GET"])
def index():
    tasks = read_tasks()
    return render_template("index.html", tasks=tasks)


@app.route("/add", methods=["POST"])
def add_task():
    task = request.form.get("task", "").strip()
    if task:
        tasks = read_tasks()
        tasks.append(task)
        write_tasks(tasks)
    return redirect(url_for("index"))


@app.route("/delete/<int:index>", methods=["GET"])
def delete_task(index):
    tasks = read_tasks()
    if 0 <= index < len(tasks):
        tasks.pop(index)
        write_tasks(tasks)
    return redirect(url_for("index"))


if __name__ == "__main__":
    app.run(debug=True)

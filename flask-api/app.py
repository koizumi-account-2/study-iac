#! /usr/bin/env python3

from flask import Flask, request
import os

app = Flask(__name__)

# health check
@app.route("/health")
def health():
    return "OK"

# 回答を受け取る
@app.route("/q")
def q():
    answer_input = request.args.get("a")
    if not answer_input:
        return "No answer input", 400
    
    try:
        if answer_input == os.environ["CORRECT_ANSWER"]:
            return "Correct", 200
        else:
            return "Incorrect", 400
    except Exception:
        return "Error", 500
    
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)


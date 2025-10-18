import json
from os.path import dirname, join

__all__ = ["PRIZE_DATA"]

with open(join(dirname(__file__), "eveparty.json"), encoding="utf-8") as file:
    PRIZE_DATA = json.load(file)
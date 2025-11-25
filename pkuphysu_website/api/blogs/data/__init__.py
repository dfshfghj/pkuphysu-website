import json
from os.path import dirname, join

__all__ = ["TAG_DATA"]

with open(join(dirname(__file__), "tags.json"), encoding="utf-8") as file:
    TAG_DATA = json.load(file)

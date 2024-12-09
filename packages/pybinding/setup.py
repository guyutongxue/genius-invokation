from setuptools import setup, find_packages
import json
from datetime import datetime

with open("package.json", "r") as f:
    package = json.load(f)

with open("README.md", "r") as f:
    long_description = f.read()

version = package["version"]
# version = f"{package['version']}.dev{datetime.now().strftime('%Y%m%d%H%M')}"

setup(
    name="gitcg",
    version=version,
    description="A Python binding of Genius-Invokation TCG",
    long_description=long_description,
    long_description_content_type="text/markdown",
    include_package_data=True,
    packages=find_packages(),
    install_requires=["cffi", "protobuf"],
)

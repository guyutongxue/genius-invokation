from setuptools import setup, find_packages
from setuptools.dist import Distribution
import json

class BinaryDistribution(Distribution):
    """Distribution which always forces a binary package with platform name"""
    def has_ext_modules(self):
        return True

with open("package.json", "r") as f:
    package = json.load(f)

setup(
    name="gitcg",
    version=package["version"],
    include_package_data=True,
    packages=find_packages(),
    install_requires=["cffi"],
    distclass=BinaryDistribution
)

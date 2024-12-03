from setuptools import setup, find_packages
from setuptools.dist import Distribution
import json
from datetime import datetime


class BinaryDistribution(Distribution):
    """Distribution which always forces a binary package with platform name"""

    def has_ext_modules(self):
        return True


with open("package.json", "r") as f:
    package = json.load(f)

version = f"{package['version']}.dev{datetime.now().strftime('%Y%m%d%H%M')}"

setup(
    name="gitcg",
    version=version,
    include_package_data=True,
    packages=find_packages(),
    install_requires=["cffi", "protobuf"],
    distclass=BinaryDistribution,
)

from setuptools import setup, find_packages
from setuptools.dist import Distribution

class BinaryDistribution(Distribution):
    """Distribution which always forces a binary package with platform name"""
    def has_ext_modules(self):
        return True


setup(
    name="gitcg",
    version="0.14.3",
    include_package_data=True,
    packages=find_packages(),
    install_requires=["cffi"],
    distclass=BinaryDistribution
)

from setuptools import setup, find_packages

setup(
    name="gitcg",
    version="0.14.3",
    include_package_data=True,
    packages=find_packages(),
    install_requires=["cffi"],
)

#coding: utf-8
import os
from setuptools import setup, find_packages

def read(fname):
    try:
        return open(os.path.join(os.path.dirname(__file__),
            fname)).read()
    except IOError:
        return ''

setup(name='m3-core',
      version='2.0.10.7',
      url='https://src.bars-open.ru/py/m3/m3',
      license='License :: OSI Approved :: MIT License',
      author='BARS Group',
      author_email='telepenin@bars-open.ru',
      package_dir={'': 'src'},
      packages=find_packages('src'),
      description=read('DESCRIPTION.md'),
      install_requires=read('REQUIREMENTS'),
      long_description=read('README.md'),
      include_package_data=True,
      classifiers=[
        'Intended Audience :: Developers',
        'Environment :: Web Environment',
        'Natural Language :: Russian',
        'Natural Language :: English',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Development Status :: 4 - Beta',
      ],
)

How to build the documentation
------------------------------


Requirements
^^^^^^^^^^^^

The documentation is built using ``sphinx``, so you need to have it:

::

    pip install sphinx sphinx-autobuild

You will also need a ``latex`` distribution installed on you machine for the pdf manual. For instance,

::

    apt-get install texlive-full


Docs Creation
^^^^^^^^^^^^^

Go to the ``docs`` folder.

For the html version:

::

    make html

For the pdf version:

::

    make latexpdf


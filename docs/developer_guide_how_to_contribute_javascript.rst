.. _how-to-contribute-js-label:

How to contribute to Javascript code
------------------------------------

.. index::
    single: contribution

Here are a few hints and rules to get you started:

- Add yourself to the AUTHORS.txt_ file in an alphabetical fashion. Every contribution is valuable and shall be credited.
- If your change is noteworthy, add an entry to the changelog_.
- No contribution is too small; please submit as many fixes for typos and grammar bloopers as you can!
- *Always* add tests and docs for your code. This is a hard rule; patches with missing tests or documentation won't be merged.
  If a feature is not tested or documented, it does not exist.
- Write `good commit messages`_.
- Ideally, `collapse`_ your commits, i.e. make your pull requests just one commit.
- Use camel case (no snake case):

  - ``let newVariable = 0;``
  - ``const someConstant = 1;``

- *Always* use the strict equality operator (``===``) in place of the abstract equality operator (``==``).
- Use ``isNaN(x)`` function to test if a number is ``NaN``.
- Use ``Number.EPSILON`` and a relational operator to compare fractional numbers.


.. note::
   If you have something great but aren't sure whether it adheres -- or even can adhere -- to the rules above: **please submit a pull request anyway**!
   In the best case, we can mold it into something, in the worst case the pull request gets politely closed.
   There's absolutely nothing to fear.

Thank you for considering to contribute! If you have any question or concerns, feel free to reach out to us (see :ref:`credits-label`).

.. _`Code of Conduct`: http://www.python.org/psf/codeofconduct/
.. _AUTHORS.txt: https://bitbucket.org/ccomjhc/hyo_smartmap_webgis/raw/master/AUTHORS.rst
.. _changelog: https://bitbucket.org/ccomjhc/hyo_smartmap_webgis/raw/master/HISTORY.rst
.. _`PEP 8`: http://www.python.org/dev/peps/pep-0008/
.. _`PEP 257`: http://www.python.org/dev/peps/pep-0257/
.. _collapse: https://www.mercurial-scm.org/wiki/RebaseExtension
.. _`good commit messages`: http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html


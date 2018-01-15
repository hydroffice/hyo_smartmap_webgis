.. _how-to-install-label:

How to install
--------------

.. index::
    install


- Install ``git``.
- Install ``npm`` using the latest installer in the `Node.js home page <https://nodejs.org/en/>`_.

  - Execute ``npm init`` if you need to initialize the ``package.json`` file.
  - Execute ``npm install`` to install the required packages.
  - If you want to add a required package, run ``npm install --save xxxxxx``

- Install ``gulp`` globally by executing ``npm install -g gulp``.
- Install ``npm install --save-dev gulp``.
- Install ``babel`` (transcompiler from ES6 to ES5)

  - Execute ``npm install --save-dev babel-preset-es2015``.
  - Execute ``npm install --save-dev gulp-babel``

- Install ``eslint`` by executing ``npm install -g eslint``.

  - Initialize ``eslint`` by executing ``eslint --init``.
  - Add to the required packages: ``npm install --save-dev gulp-eslint``

- For updating ``npm``:

  - Execute ``npm install -g npm@next``

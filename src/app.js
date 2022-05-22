#!/usr/bin/env -S node --experimental-json-modules --no-warnings --enable-source-maps

import { Command } from 'commander';
import { initConnections } from './api/AuthApi.js';
import admin from './commands/admin/cmd.js';
import connections from './commands/connections/cmd.js';
import idm from './commands/idm/cmd.js';
import info from './commands/info/cmd.js';
import journey from './commands/journey/cmd.js';
import logging from './commands/logging/cmd.js';
import realm from './commands/realm/cmd.js';
import script from './commands/script/cmd.js';
import secret from './commands/secret/cmd.js';
import theme from './commands/theme/cmd.js';
import idp from './commands/idp/cmd.js';
import emailTemplate from './commands/email_templates/cmd.js';
import storage from './storage/SessionStorage.js';
import application from './commands/application/cmd.js';
import pkg from '../package.json' assert { type: 'json' };
import { printMessage } from './api/utils/Console.js';

const program = new Command(pkg.name).version(
  `v${pkg.version} [${process.version}]`,
  '-v, --version'
);

storage.session.setFrodoVersion(`v${pkg.version} [${process.version}]`);

(async () => {
  try {
    initConnections();

    program.addCommand(admin());
    program.addCommand(application());
    program.addCommand(connections());
    program.addCommand(emailTemplate());
    program.addCommand(idm());
    program.addCommand(idp());
    program.addCommand(info());
    program.addCommand(journey());
    program.addCommand(logging());
    program.addCommand(realm());
    program.addCommand(script());
    program.addCommand(secret());
    program.addCommand(theme());

    program.showHelpAfterError();
    program.parse();
  } catch (e) {
    printMessage(`ERROR: exception running frodo - ${e}`, 'error');
  }
})();

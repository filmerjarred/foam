import { URI } from '../core/model/uri';
import path from 'path';
import { toVsCodeUri } from '../utils/vsc-utils';
import { commands, window, workspace } from 'vscode';

describe('createFromTemplate', () => {
  describe('create-note-from-template', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('offers to create template when none are available', async () => {
      const spy = jest
        .spyOn(window, 'showQuickPick')
        .mockImplementationOnce(jest.fn(() => Promise.resolve(undefined)));

      await commands.executeCommand('foam-vscode.create-note-from-template');

      expect(spy).toBeCalledWith(['Yes', 'No'], {
        placeHolder:
          'No templates available. Would you like to create one instead?',
      });
    });
  });

  describe('create-note-from-default-template', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it.skip('can be cancelled while resolving FOAM_TITLE', async () => {
      const spy = jest
        .spyOn(window, 'showInputBox')
        .mockImplementation(jest.fn(() => Promise.resolve(undefined)));

      // The following is a workaround code to achieve this:
      // const fileWriteSpy = jest.spyOn(workspace.fs, 'writeFile');
      // as writeFile is a read-only property.
      // the approach is a bit risky and britte as it overwrites the whole module
      // but will be enough for now.
      const oldFs = workspace.fs;
      const fileWriteSpy = jest.fn(workspace.fs.writeFile);
      Object.defineProperty(workspace, 'fs', {
        value: { writeFile: fileWriteSpy },
      });

      await commands.executeCommand(
        'foam-vscode.create-note-from-default-template'
      );

      expect(spy).toBeCalledWith({
        prompt: `Enter a title for the new note`,
        value: 'Title of my New Note',
        validateInput: expect.anything(),
      });

      expect(fileWriteSpy).toHaveBeenCalledTimes(0);

      // restore the old fs object or all tests will be affected by this one
      Object.defineProperty(workspace, 'fs', {
        value: oldFs,
      });
    });
  });

  describe('create-new-template', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should create a new template', async () => {
      const template = path.join(
        workspace.workspaceFolders[0].uri.fsPath,
        '.foam',
        'templates',
        'hello-world.md'
      );

      window.showInputBox = jest.fn(() => {
        return Promise.resolve(template);
      });

      await commands.executeCommand('foam-vscode.create-new-template');

      const file = await workspace.fs.readFile(toVsCodeUri(URI.file(template)));
      expect(window.showInputBox).toHaveBeenCalled();
      expect(file).toBeDefined();
    });

    it('can be cancelled', async () => {
      // This is the default template which would be created.
      const template = path.join(
        workspace.workspaceFolders[0].uri.fsPath,
        '.foam',
        'templates',
        'new-template.md'
      );
      window.showInputBox = jest.fn(() => {
        return Promise.resolve(undefined);
      });

      await commands.executeCommand('foam-vscode.create-new-template');

      expect(window.showInputBox).toHaveBeenCalled();
      await expect(
        workspace.fs.readFile(toVsCodeUri(URI.file(template)))
      ).rejects.toThrow();
    });
  });
});

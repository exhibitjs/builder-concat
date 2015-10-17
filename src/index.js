import reorientCSS from 'reorient-css';
import findAssets from 'find-assets';
import {createHash} from 'crypto';
import path from 'path';

const semicolonBuffer = new Buffer(';');

export default function () {
  return function exhibitConcat(job) {
    const {
      file, contents, ext, importFile, emit,
      util: {Promise, SourceError, _},
    } = job;

    switch (ext) {
      // reject any CSS/JS from getting through directly
      case '.css':
      case '.js':
        return null;

      // process html
      case '.html':
        const inputHTML = contents.toString();
        const baseDir = path.dirname(file);

        // load all assets and augment the groups array with their contents
        return Promise.map(findAssets.html(inputHTML), group => {
          if (isLocalURL(group[0].url)) {
            return Promise.map(group, asset => {
              // establish real file path to asset
              let assetPath;
              if (asset.url.charAt(0) === '/') {
                throw new Error('Absolute URLs not yet implemented by concat plugin');
              }
              else {
                assetPath = path.resolve(path.dirname(path.normalize(file)), path.normalize(asset.url));
              }

              return importFile(assetPath)
                .then(loadedAsset => {
                  asset.contents = loadedAsset.contents;
                  asset.realPath = loadedAsset.file;
                  asset.realPathRelative = path.relative(baseDir, loadedAsset.file);
                  return asset;
                })
                .catch(error => {
                  if (error.code === 'ENOENT' || error.code === 'EISDIR') {
                    // return an empty asset
                    asset.contents = new Buffer('');
                    asset.realPath = assetPath;
                    asset.realPathRelative = path.relative(baseDir, assetPath);

                    // and emit a warning
                    const linesUntilAsset = inputHTML.substring(0, asset.start).split('\n');
                    const line = linesUntilAsset.length;
                    const column = linesUntilAsset[line - 1].length + 1;

                    emit('error', new SourceError({
                      warning: true,
                      message: `Missing file "${asset.realPathRelative}" will not be included in concatenation`,
                      file,
                      contents: inputHTML,
                      line,
                      column,
                    }));

                    return asset;
                  }

                  throw error;
                });
            });
          }

          return null; // not a local asset URL; ignore
        }).then(groups => {
          // all async work is done now. just build the new HTML and output all the files...
          const results = {};
          let fixedHTML = '';
          let lastIndex = 0;

          for (const group of groups) {
            if (!group) continue;

            // add the HTML up to the start of this asset
            fixedHTML += inputHTML.substring(lastIndex, group[0].start);

            if (group.length > 1) {
              // this is a concatenatable asset (what we're here for).
              // make a custom path where we will save it - TODO WITH A HASH OF THE FILENAMES
              const concatPath = path.resolve(baseDir, (
                'concat-' +
                // todo: make the asset paths relative here
                digest(
                  new Buffer(
                    _.pluck(group, 'realPathRelative').join('\n')
                  )
                ).substring(0, 5) +
                (group[0].type === 'script' ? '.js' : '.css')
              ));
              const concatPathRelative = path.relative(baseDir, concatPath);

              // concatenate it!
              const buffers = [];
              let i = 0;
              let lastAsset;
              for (const asset of group) {
                // for safer concatenating of scripts, interleave them with semicolons
                if (asset.type === 'script' && i++ > 0) buffers.push(semicolonBuffer);

                // if CSS, rebase all the URLs.
                if (asset.type === 'stylesheet' && path.dirname(asset.realPathRelative) !== baseDir) {
                  // todo: maybe use this via postcss so can preserve source map accuracy...
                  // https://github.com/callumlocke/reorient-css#postcss

                  asset.contents = new Buffer(reorientCSS(
                    asset.contents.toString(),
                    asset.realPathRelative,
                    concatPathRelative
                  ).css);
                }

                buffers.push(asset.contents);
                lastAsset = asset;
              }

              results[concatPath] = Buffer.concat(buffers);

              // add the new asset HTML
              const concatURL = path.posix.normalize(concatPathRelative);
              if (lastAsset.type === 'script') {
                fixedHTML += `<script src="${concatURL}"></script>`;
              }
              else if (lastAsset.type === 'stylesheet') {
                fixedHTML += `<link rel="stylesheet" href="${concatURL}">`;
              }
              else throw new Error('bug?');

              lastIndex = lastAsset.end;
            }
            else {
              // this is a single asset; just output it
              const asset = group[0];
              results[asset.realPath] = asset.contents;

              // and add the untouched asset tag into the HTML, and update the last index
              fixedHTML += asset.string;
              lastIndex = asset.end;
            }
          }


          // finish off with the remaining HTML
          fixedHTML += inputHTML.substring(lastIndex);

          // add the fixed HTML file itself and return
          results[file] = fixedHTML;
          return results;
        });

      // all other filetypes allowed through unmodified
      default:
        return contents;
    }
  };
}


function isLocalURL(url) {
  return url && url.indexOf('//') === -1 && url.indexOf(':') === -1;
}


function digest(buffer) {
  const shasum = createHash('md5');
  shasum.update(buffer);
  return shasum.digest('hex');
}

var exec = require("child_process").exec;

var deployRepo = "upstream";
var deployBranch = "types";
var deployDirectory = "packages\\geoview-core\\types";

var execCommand = function (command, cb) {
  return new Promise(function (resolve) {
    exec(command, function (err, stdout, stderr) {
      if (err != null) {
        console.log(new Error(err));

        resolve(null);
      } else if (typeof stderr != "string") {
        console.log(new Error(stderr));

        resolve(null);
      } else {
        resolve(stdout);
      }
    });
  });
};

var prevBranch = "develop";

async function _run() {
  var result = await execCommand(`git rev-parse --abbrev-ref HEAD`);

  if (result) prevBranch = result;

  await execCommand(`git symbolic-ref HEAD refs/heads/${deployBranch}`);
  await execCommand(`git --work-tree ${deployDirectory} reset --mixed --quiet`);
  await execCommand(
    `git --work-tree ${deployDirectory} checkout origin/${deployBranch} package.json`
  );
  await execCommand(`git --work-tree ${deployDirectory} add --all`);
  await execCommand(
    `git --work-tree ${deployDirectory} commit -nm "types updates"`
  );
  await execCommand(`git push --force --quiet ${deployRepo} ${deployBranch}`);
  await execCommand(`git symbolic-ref HEAD refs/heads/${prevBranch}`);
  await execCommand(`git reset --mixed`);
}

_run();

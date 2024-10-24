{
  pkgs ? import <nixpkgs> { },
}:

pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs
    pkgs.nodePackages.rush
    pkgs.npm-check-updates
  ];

  shellHook = ''
    echo "Development environment ready. You can use 'rush' now."
  '';
}

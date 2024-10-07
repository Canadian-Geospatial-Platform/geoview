{
  pkgs ? import <nixpkgs> { },
}:

pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs
    pkgs.nodePackages.rush
  ];

  shellHook = ''
    echo "Development environment ready. You can use 'rush' now."
  '';
}

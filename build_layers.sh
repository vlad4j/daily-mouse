layers=("lib/lambda/layer/nodejs")

name=""
for path in ${layers[@]}; do
  name=$(basename $path)

  rm -rf $path/node_modules/sharp
  # Get sharp version for arm64. See: https://sharp.pixelplumbing.com/install#aws-lambda
  (cd $path && SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install --arch=arm64 --platform=linux --libc=glibc sharp)

  echo "Moving node_modules for ${name} ..."
  mv $path/node_modules dist/$path/node_modules

  if [ "$(uname)" == "Darwin" ] || [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
     cd dist/$path/..; zip -r -q $name/$name.zip ./; cd -
  else
    powershell Compress-Archive dist/$path dist/$path/$name.zip
  fi
done

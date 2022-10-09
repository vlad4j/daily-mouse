layers=("lib/lambda/layer/nodejs")

name=""
for path in ${layers[@]}; do
  name=$(basename $path)
  echo "Moving node_modules for ${name} ..."
  mv $path/node_modules dist/$path/node_modules
#  zip -r -q dist/$path dist/$path/$name.zip
  powershell Compress-Archive dist/$path dist/$path/$name.zip
done

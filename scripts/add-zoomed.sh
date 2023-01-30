# trim whitespace and save to zoomed/equipment
mogrify -trim +repage -background none -path static/zoomed/equipment static/equipment/*.png

# make the aspect ratio square
for filename in static/zoomed/equipment/*.png; do
  width=`convert $filename -ping -format "%w" info:`
  width=`convert $filename -ping -format "%h" info:`
  greater=`[[ ${widt} -gt ${height} ]] && echo $width || echo $height`
  mogrify -gravity center -background none -extent ${greater}x${greater} $filename;
done
mogrify -trim +repage -background none -path static/zoomed/equipment static/equipment/*.png

for filename in static/zoomed/equipment/*.png; do
  ww=`convert $filename -ping -format "%w" info:`
  hh=`convert $filename -ping -format "%h" info:`
  greater=`[[ ${ww} -gt ${hh} ]] && echo $ww || echo $hh`
  mogrify -gravity center -background none -extent ${greater}x${greater} $filename;
done
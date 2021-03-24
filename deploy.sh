echo "Building app"
yarn build;
echo "Deploying app"
cd build;
scp -r * newprod@178.128.155.164:~/chc-search-react/;
#ssh newprod@178.128.155.164 "chmod -R 755 ~/chc-search-react/";

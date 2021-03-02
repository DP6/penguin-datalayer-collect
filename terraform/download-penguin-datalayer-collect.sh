
#!/bin/bash
curl https://codeload.github.com/DP6/penguin-datalayer-collect/zip/v$1 --output code.zip
unzip code.zip
rm -f code.zip
cd penguin-datalayer-collect-$1
zip -r $1.zip ./*
mv $1.zip ../penguin-datalayer-collect/
cd ..
mv $1.zip ./files-copy-to-gcs/
echo "Iniciando copia para GCP"
gsutil cp -r ./files-copy-to-gcs/* gs://$2
echo "excluindo a pasta do código baixado do git"
rm -rf penguin-datalayer-collect-*
echo "FIM script "$0

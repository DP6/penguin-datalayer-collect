
#!/bin/bash
echo "Executando "$0 " com os parâmetros versão="$1 " e bucket="$2
curl https://codeload.github.com/DP6/penguin-datalayer-collect/zip/v$1 --output code.zip
unzip code.zip
rm -f code.zip
cd penguin-datalayer-collect-$1
zip -r $1.zip package.json index.js LICENSE README.md
echo "movendo zip para raiz da pasta terraform"
cd ..
mv ./penguin-datalayer-collect-$1/$1.zip ./files-copy-to-gcs/penguin-datalayer-collect
echo "Iniciando copia para GCP"
gsutil cp -r ./files-copy-to-gcs/* gs://$2
echo "excluindo a pasta do código baixado do git e zip gerado"
rm -rf penguin-datalayer-collect-*
rm -f ./files-copy-to-gcs/penguin-datalayer-collect/$1.zip
echo "FIM script "$0

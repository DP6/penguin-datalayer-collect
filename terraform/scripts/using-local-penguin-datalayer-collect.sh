
#!/bin/bash
echo "Executando $0  com os parâmetros versão=$1  e bucket=$2"
echo "Acessando diretorio raiz do projeto"
cd ..
echo "" pwd
echo "Criando Zip"
zip -r "$1.zip" package.json index.js LICENSE README.md
echo "Movendo Zip para terraform/files-copy-to-gcs/penguin-datalayer-collect/"
mv "$1.zip" ./terraform/files-copy-to-gcs/penguin-datalayer-collect/
echo "Entrando nas pasta terraform para copiar os arquivos"
cd terraform
echo "Iniciando copia para GCP"
gsutil cp -r ./files-copy-to-gcs/* "gs://$2"
echo "excluindo zip"
rm -rf "./files-copy-to-gcs/penguin-datalayer-collect/$1.zip"
echo "FIM script $0"

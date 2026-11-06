# Instalación en Windows 11

La aplicación es estática: no requiere instalador, Node ni base de datos para funcionar.

## 1. Abrir la aplicación

1. Descomprimí o copiá la carpeta del proyecto (por ejemplo `C:\devops-bootcamp`).
2. Hacé doble clic en `index.html`.
3. Se abre en tu navegador predeterminado. Funciona mejor en Chrome o Edge actualizados.

Si ves una página en blanco, abrí la consola con `F12` y revisá el error. La causa más común es un archivo faltante en `js/`.

### Alternativa recomendada: servidor local

Algunos navegadores limitan `localStorage`, `sessionStorage` o las descargas cuando se abre con `file://`. Para evitarlo, serví la carpeta:

```bash
cd C:\devops-bootcamp
python -m http.server 8080
```

Luego abrí <http://localhost:8080>. Para detener el servidor, `Ctrl + C`.

Si no tenés Python, instalalo desde Microsoft Store (`python`) o usá Node:

```bash
npx serve .
```

## 2. Verificar que todo está completo

Con Node.js instalado:

```bash
node tools/validate.js
```

Debe terminar con `OK: todas las validaciones pasaron.` y mostrar 29 módulos, 139 tarjetas, 150 preguntas, 31 laboratorios y 12 escenarios.

## 3. Preparar el entorno para misiones reales (opcional)

Las misiones "máquina real" se ejecutan en tu propio Ubuntu. Para tenerlo en Windows 11:

```powershell
wsl --install -d Ubuntu
wsl --set-default-version 2
```

Reiniciá si Windows lo pide y creá tu usuario de Ubuntu. Verificá:

```bash
wsl -l -v
```

### Docker

Opción A: Docker Desktop con integración WSL2 (más simple).
Opción B: Docker Engine dentro de Ubuntu (más liviano, ideal para 8 GB de RAM):

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER
# cerrar y reabrir la sesión de WSL para aplicar el grupo
docker run --rm hello-world
```

### Kubernetes local

Con 8 GB de RAM, preferí `kind` o `k3s` antes que minikube con driver pesado:

```bash
# kind
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.23.0/kind-linux-amd64
chmod +x ./kind && sudo mv ./kind /usr/local/bin/kind
kind create cluster --name bootcamp

# kubectl
sudo apt install -y kubectl || {
  curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
  sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
}
kubectl get nodes
```

### Terraform

```bash
sudo apt install -y unzip
curl -LO https://releases.hashicorp.com/terraform/1.9.8/terraform_1.9.8_linux_amd64.zip
sudo unzip terraform_1.9.8_linux_amd64.zip -d /usr/local/bin/
terraform version
```

No es obligatorio instalar nada de esto para completar el plan: los módulos y laboratorios guiados funcionan igual.

## 4. Primer uso

1. Andá a **Ajustes** y definí tu nombre y la **fecha de inicio** del plan.
2. Volvé al **Panel** y empezá por el Día 1.
3. Antes de cerrar, usá **Exportar JSON** para guardar un backup.

## 5. Backup, restauración y borrado

- **Exportar**: Ajustes → Exportar JSON. Descarga `devops-bootcamp-AAAA-MM-DD.json`.
- **Importar**: Ajustes → Importar → elegí el archivo. Reemplaza el progreso actual.
- **Borrar todo**: Ajustes → Borrar todo. Pide confirmación; no se puede deshacer sin backup.

El progreso se guarda en la clave `devops-bootcamp-v1` de `localStorage` del navegador y origen usado (`file://` y `http://localhost:8080` son orígenes distintos: no comparten datos).

## 6. Actualizar el contenido

La app no tiene build. Para actualizar, reemplazá los archivos `js/`, `css/` e `index.html` conservando tu `localStorage`. Si el formato de datos cambia, la app hace merge con los valores por defecto y conserva tu progreso.

Para regenerar la biblioteca Linux desde el manual original:

```bash
node tools/extract-course.js
```

## 7. Problemas frecuentes

Ver `TROUBLESHOOTING.md`. Los más comunes:

- Página en blanco → abrir consola (`F12`) y verificar que existan `js/ui/app.js` y los archivos de datos.
- El progreso no persiste → servir por `http://localhost` en lugar de `file://`, y no usar modo incógnito.
- Un laboratorio no valida → leer la pista de cada check; la validación es estricta a propósito.

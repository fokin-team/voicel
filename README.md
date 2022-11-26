![GitHub Actions](https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white)
![Figma](https://img.shields.io/badge/figma-%23F24E1E.svg?style=for-the-badge&logo=figma&logoColor=white)
![NPM](https://img.shields.io/badge/NPM-%23000000.svg?style=for-the-badge&logo=npm&logoColor=white)
![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
![SASS](https://img.shields.io/badge/SASS-hotpink.svg?style=for-the-badge&logo=SASS&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Vue.js](https://img.shields.io/badge/vuejs-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D)
![Visual Studio Code](https://img.shields.io/badge/Visual%20Studio%20Code-0078d7.svg?style=for-the-badge&logo=visual-studio-code&logoColor=white)
![WebStorm](https://img.shields.io/badge/webstorm-143?style=for-the-badge&logo=webstorm&logoColor=white&color=black)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Ubuntu](https://img.shields.io/badge/Ubuntu-E95420?style=for-the-badge&logo=ubuntu&logoColor=white)
![Nginx](https://img.shields.io/badge/nginx-%23009639.svg?style=for-the-badge&logo=nginx&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
# Voicel

Voicel - это ВКС-система на базе низкоуровневой С++ библиотеки [mediasoup](https://github.com/versatica/mediasoup/).

Демонстрационный вариант приложения размещен на сайте [voicel.ru](https://voicel.ru)

## Арихитектура

В основе разрабатываемого решения лежит низкоуровневая С++ библиотека [mediasoup](https://github.com/versatica/mediasoup/), которая предоставляет API для управления медиаслоем на базе технологии WebRTC.

Для реализации проекта было принято решение использоватеь архитектуру SFU (Selective Forwarding Unit), при которой процесс передачи данных между сервером и терминалами происходит следующим образом:

1. Получение сервером входящих видеопотоков от всех терминалов.
2. Отправка каждому терминалу сервером нескольких копий видеопотоков остальных участников без сжатия.
3. Склейка терминалами входящих видеопотоков.

Благодаря этому клиенту не нужно передавать один и тот же исходящий сигнал каждому из участников, вместо этого поток отправляется на сервер, а уже там распределяется между всеми пользователями. В итоге от участника отправляется один исходящий сигнал, а сам он принимает потоки других пользователей от сервера. В отличии от архитектуры Mesh, где каждый каждому отправляет свой медиа поток и получает медма поток от других.

Более подробно ознакомится с архитектурными решениями видеоконференц систем, а также о их преимуществах и недостатках можно по этой [ссылке](https://www.youtube.com/watch?v=d2N0d6CKrbk).

![](https://trueconf.ru/blog/wp-content/uploads/2019/08/sfu_2.jpg)

В дальнейшем равитии проекта, есть возможность перейти к архитектуре SVC (Scalable Video Coding) на основе масштабируемого видеокодирования, работа которой представлена в виде слеующих этапов:

1. Клиент формирует SVC-поток за счет сжатия видеопотока слоями и отправляет его ВКС-серверу. При этом количество слоёв в потоке, которое будет отправлено, определяется шириной канала связи и полосы пропускания.
2. Сервер обрабатывает полученные SVC-потоки от всех клиентов, отсекая лишние слои без перекодирования.
3. Сервер возвращает каждому клиенту обработанные видеопотоки остальных участников.
4. Клиент формирует раскладку видеоконференции.

![](https://trueconf.ru/blog/wp-content/uploads/2019/08/svc_2.jpg)

**Преимущества архитектуры**

- Так как исходящий поток только один — отпадает необходимость в широком исходящем канале для клиента.
- Входящее подключение осуществляется не к каждому участнику напрямую, а к медиа-серверу.
- Относительная нетребовательность к ресурсам сервера по сравнению с другими архитектурами видеоконференций.

## Mediasoup

Выбар пал на C++ библиотеку [mediasoup](https://github.com/versatica/mediasoup/) по ряду причин:

1. Простота управления медиа слоем
2. Простота архитектурных элементов (воркер, продюсер, потребитель, пир, комната и т.д) для менеджмента сети 
3. Использование WebRTC
4. Высокая производительность, за счет использования C++ и libuv в реализации
5. Легкость перехода с SFU на SVC архитектуру

![](https://russianblogs.com/images/487/8b95376063b4d7889991b250a23fad9f.png)


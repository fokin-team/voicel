import { Router, Worker, Producer } from 'mediasoup/node/lib/types';
import { config } from './mediasoup.config';
import { Peer } from './mediasoup.peer';

export class Room {
    public id: string;
    public router: Router;
    public peers: Map<string, Peer> = new Map();

    /**
     * Конструктор
     * 
     * @param id уникальный идентификатор комнаты
     * @param worker воркер
     */
    constructor(id: string, worker: Worker, private broadcast: {
        single: (id: string, data: any) => void;
        all: (data: any) => void;
    }) {
        this.id = id;

        // Получаем настройки для меиа потоков
        const mediaCodecs = config.mediasoup.router.mediaCodecs

        // Создание роутера для комнаты
        worker.createRouter({ mediaCodecs })
          .then((router) => { this.router = router })
    }

    /**
     * Добавить пир в комнату 
     * @param peer 
     */
    public addPeer(peer: Peer) {
        this.peers.set(peer.id, peer)
    }

    /**
     * Получить список продюсеров в комнате
     * @returns
     */
    public getProducerListForPeer() {
        let producerList = []

        this.peers.forEach((peer) => {
            peer.producers.forEach((producer) => {
                producerList.push({
                    producerId: producer.id
                })
            })
        })

        return producerList
    }

    /**
     * 
     * @returns 
     */
    public getRtpCapabilities() {
        return this.router.rtpCapabilities
    }

    /**
     * Создать WebRTC транспорт для пира
     * 
     * @param peerId уникальный идентификатор пира
     * @returns 
     */
    public async createWebRtcTransport(peerId: string) {
        const { maxIncomingBitrate, initialAvailableOutgoingBitrate } = config.mediasoup.webRtcTransport;

        const transport = await this.router.createWebRtcTransport({
            listenIps: config.mediasoup.webRtcTransport.listenIps,
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
            initialAvailableOutgoingBitrate
        });

        if (maxIncomingBitrate) {
            try {
                await transport.setMaxIncomingBitrate(maxIncomingBitrate);
            } catch (error) { 
                console.log(error);
            }
        }

        transport.on('dtlsstatechange', (dtlsState) => {
            if (dtlsState === 'closed') { transport.close(); }
        })

        transport.on('@close', () => {
            console.log("Transport close");
        })

        console.log('Adding transport', { transportId: transport.id })

        this.peers.get(peerId).addTransport(transport)
        
        return {
            params: {
                id: transport.id,
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters
            }
        }
    }


    /**
     * Подключить пир к транспорту
     * 
     * @param peerId уникальный идентификатор пира
     * @param transportId уникальный идентификатор транспорта
     * @param dtlsParameters параметры
     * @returns 
     */
    public async connectPeerTransport(peerId: string, transportId: string, dtlsParameters) {
        // Если такого пира в комнате нет, закругляемся
        if (!this.peers.has(peerId)) return

        await this.peers.get(peerId).connectTransport(transportId, dtlsParameters)
    }

    /**
     * Продюсирование
     * 
     * @param peerId уникальный идентификатор пира
     * @param producerTransportId  уникальный идентификатор транспорта продюсера
     * @param rtpParameters параметры
     * @param kind 
     * @returns 
     */
    public async produce(peerId: string, producerTransportId: string, rtpParameters, kind) {
        let main = this

        return new Promise(
            async function (resolve, reject) {
                let producer = await main.peers.get(peerId).createProducer(producerTransportId, rtpParameters, kind)

                resolve(producer.id)
        
                main.broadcast.single(peerId, 'newProducers', )
            }
        )
    }

    /**
     * Потребление
     * 
     * @param peerId уникальный идентификатор пользователя
     * @param consumerTransportId уникальный идентификатор транспорта потребителя
     * @param producerId уникальный идентификатор продюсера
     * @param rtpCapabilities параметры
     * @returns 
     */
    public async consume(peerId: string, consumerTransportId: string, producerId: string, rtpCapabilities) {
        if (
            !this.router.canConsume({
                producerId: producerId,
                rtpCapabilities
            })
        ) {
            console.error('can not consume')
            return
        }

        let { consumer, params } = await this.peers
            .get(peerId)
            .createConsumer(consumerTransportId, producerId, rtpCapabilities)

        consumer.on('producerclose', () => {
                console.log('Consumer closed due to producerclose event', {
                    name: `${this.peers.get(peerId).name}`,
                    consumer_id: `${consumer.id}`
                })
                
                this.peers.get(peerId).removeConsumer(consumer.id)

                // TODO: tell client consumer is dead
                // this.io.to(peerId).emit('consumerClosed', {
                //     consumer_id: consumer.id
                // })
            }
        )

        return params
    }

    /**
     * Удалить пир из комнаты
     * @param peerId уникальный идентификатор пира
     */
    public async removePeer(peerId: string) {
        this.peers.get(peerId).close();
        this.peers.delete(peerId);
    }

    /**
     * Закрыть продюсирование
     * @param peerId уникальный идентификатор пира
     * @param producerId уникальный идентификатор продюсера
     */
    closeProducer(peerId: string, producerId: string) {
        this.peers.get(peerId).closeProducer(producerId);
    }

    /**
     * Отправить сообщение пиру
     * @param peerId уникальный идентификатор пира
     * @param name название сообщение
     * @param data данные сообщения
     */
    public send(peerId: string, name: string, data: any) {
        // TODO: реализовать отправку сообщение по сокетам
        // this.io.to(peerId).emit(name, data)
    }

    /**
     * Получить список пиров комнаты
     * @returns 
     */
    public getPeers() {
        return this.peers;
    }

    /**
     * Конвертировать этот объект в JSON
     * @returns 
     */
    public toJson() {
        return {
            id: this.id,
            peers: JSON.stringify([...this.peers])
        }
    }
}
import { AccessToken } from './../codegen/api';
import * as io from 'socket.io-client';

import { CustomAPI, Card } from "../codegen/api";

export interface ISocketCallbacks {
  onConnect?: () => void;
  onAuthenticated?: () => void;
  onError?: (error: any) => void;
  onMovieStart?: (movie: { movie_id: string }) => void;
  onMovieEnd?: () => void;
  onSceneStart?: (scene: { cards: Card[] }) => void;
  onSceneUpdate?: (scene: { cards: Card[] }) => void;
  onSceneEnd?: () => void;
  onPauseStart?: () => void;
  onPauseEnd?: () => void;
}
/**
* EaAPI - Helper class that connects to
* the Dive's Experience Amplifier API
* and performs business logic
*/
export class EaAPI extends CustomAPI {
  public socket: any;
  public constructor(params: any) {
    super(params);
    this.noAuthServices = ['postToken'];
  }
  /**
   * Performs login on the Dive EA API
   * @summary Perform Login with Device
   * @param deviceId User name of the user
   */
  public loginWithDevice = (deviceId: string) => {
    this.deleteSavedToken();
    return this.postTokenAndSave({ deviceId, grantType: "device_credentials" });
  }

  public loginWithToken = (token: string) => {
    this.deleteSavedToken();
    this.writeToken(JSON.parse(token) as AccessToken);
  }

  public syncWithMovieVOD(params: { movieId?: string, timestamp?: number, protocol?: "http" | "https", callbacks?: ISocketCallbacks, socketTransports?: string[] }) {
    if (!params) {
      throw new Error("Error, missing parameters object");
    }
    if (!params.movieId) {
      throw new Error("Error, missing movieId parameter");
    }
    if (params.timestamp === undefined) {
      throw new Error("Error, missing timestamp parameter");
    }
    this.syncWithMovie({ movieId: params.movieId, timestamp: params.timestamp, protocol: params.protocol, callbacks: params.callbacks, socketTransports: params.socketTransports });
  }

  public syncWithMovieStreaming(params: { channelId?: string, protocol?: "http" | "https" | string, callbacks?: ISocketCallbacks, socketTransports?: string[] }) {
    if (!params) {
      throw new Error("Error, missing parameters object");
    }
    if (!params.channelId) {
      throw new Error("Error, missing channelId parameter");
    }
    this.syncWithMovie({ channelId: params.channelId, protocol: params.protocol, callbacks: params.callbacks, socketTransports: params.socketTransports });
  }

  public syncWithMovie(params:
    {
      channelId?: string,
      movieId?: string,
      timestamp?: number,
      protocol?: "http" | "https" | string,
      callbacks?: ISocketCallbacks,
      socketTransports?: string[],
    }
  ) {
    this.clearSocket();
    if (!params) {
      throw new Error("Error, missing parameters object");
    }
    let protocol = params.protocol || "https";
    let url = "stream.dive.tv";
    let syncType = "channels";
    // let query: any = {token: `${this.getSavedToken().access_token}`};
    let query: any = {};
    switch (this.environment) {
      case "DEV":
        url = `${protocol}://dev-${url}`;
        break;
      case "PRE":
        url = `${protocol}://pre-${url}`;
        break;
      default:
        url = `${protocol}://${url}`;
    }
    if (!params.channelId && params.movieId && params.timestamp !== undefined) {
      syncType = "movies";
      query.movie_id = params.movieId;
      query.timestamp = params.timestamp;
    } else {
      query.channel_id = params.channelId;
    }
    url = `${url}/${syncType}`;
    this.socket = io(url, {
      path: /*`/${syncType}*/`/v1/stream`,
      secure: (url.indexOf("https") > -1 ? true : false),
      forceNew: true,
      upgrade: true,
      'sync disconnect on unload': true,
      reconnect: false,
      // multiplex: false,
      // reconnection: true,
      query: query,
      // forceNew: true,
      // rejectUnauthorized: false,
      // transports: ["websocket", "xhr-polling", "polling", "htmlfile"], //, "xhr-polling", "polling", "htmlfile"],
      transports: params.socketTransports || ["polling", "websocket"],
      transportOptions: {
        polling: {
          extraHeaders: {
            'Accept-Language': this.locale,
          },
        },
        websocket: {
          extraHeaders: {
            'Accept-Language': this.locale,
          },
        },
        'xhr-polling': {
          extraHeaders: {
            'Accept-Language': this.locale,
          },
        },
        htmlfile: {
          extraHeaders: {
            'Accept-Language': this.locale,
          },
        },
      },
    } as any);
    this.socket.on('error', (error: any) => {
      console.log("SOCKET error", error);
      if (params.callbacks && params.callbacks.onError instanceof Function) {
        params.callbacks.onError(error);
      }
    });
    this.socket.on('connect', () => {
      console.log("socket connected");
      if (params.callbacks && params.callbacks.onConnect instanceof Function) {
        params.callbacks.onConnect();
      }
      this.socket.emit('authenticate', { token: this.getSavedToken().access_token })
        .on('authenticated', () => {
          console.log("authorized");
          this.socket.authenticated = true;
          if (params.callbacks && params.callbacks.onAuthenticated instanceof Function) {
            params.callbacks.onAuthenticated();
          }
        })
        .on('unauthorized', (msg: any) => {
          console.log("unauthorized: " + JSON.stringify(msg.data));
          throw new Error(msg.data.type);
        })
        .on('movie_start', (movie: { movie_id: string }) => {
          if (params.callbacks && params.callbacks.onMovieStart instanceof Function) {
            params.callbacks.onMovieStart(movie);
          }
        })
        .on('movie_end', () => {
          if (params.callbacks && params.callbacks.onMovieEnd instanceof Function) {
            params.callbacks.onMovieEnd();
          }
        })
        .on('scene_start', (scene: { cards: Card[] }) => {
          if (params.callbacks && params.callbacks.onSceneStart instanceof Function) {
            params.callbacks.onSceneStart(scene);
          }
        })
        .on('scene_update', (scene: { cards: Card[] }) => {
          if (params.callbacks && params.callbacks.onSceneUpdate instanceof Function) {
            params.callbacks.onSceneUpdate(scene);
          }
        })
        .on('scene_end', () => {
          if (params.callbacks && params.callbacks.onSceneEnd instanceof Function) {
            params.callbacks.onSceneEnd();
          }
        })
        .on('pause_start', () => {
          if (params.callbacks && params.callbacks.onPauseStart instanceof Function) {
            params.callbacks.onPauseStart();
          }
        })
        .on('pause_end', () => {
          if (params.callbacks && params.callbacks.onPauseEnd instanceof Function) {
            params.callbacks.onPauseEnd();
          }
        });
    });
  }

  public gatherCommonHeaders(params?: any) {
    //gatherCommonHeaders locale fix 2
    let newParams: any = super.gatherCommonHeaders(params);

    return newParams;
  }

  public clearSocket() {
    if (this.socket) {
      if (this.socket.connected) {
        this.socket.disconnect(true);
      }
    }
    this.socket = undefined;
  }
}
export * from "../codegen/api";
export const EaAPIClass = EaAPI;
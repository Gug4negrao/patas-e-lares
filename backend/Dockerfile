FROM haskell:9.10.3-slim-bookworm AS build

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev pkg-config zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src
RUN cabal update

COPY patas-e-lares-api.cabal cabal.project.freeze ./
RUN cabal build --only-dependencies -j

COPY . .
RUN cabal install exe:patas-e-lares-api --install-method=copy --installdir=/out --overwrite-policy=always


FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 libgmp10 libffi8 ca-certificates netbase \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /out/patas-e-lares-api /usr/local/bin/patas-e-lares-api

RUN if ldd /usr/local/bin/patas-e-lares-api | grep -q "not found"; then \
        ldd /usr/local/bin/patas-e-lares-api; exit 1; \
    fi

RUN useradd --system --no-create-home api
USER api

ENV PORT=8080
EXPOSE 8080
CMD ["patas-e-lares-api"]

import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Image, TextInput, TouchableOpacity, Text } from 'react-native';
import axios from 'axios';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import Modal from 'react-native-modal';

const GIPHY_API_KEY = 'GPbZFIJgAkYnfNKP46Zp2ONP1ohUwdDM';  

const Home = () => {
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [offset, setOffset] = useState(0); // Pagination
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGif, setSelectedGif] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const LIMIT = 20;

  useEffect(() => {
    fetchGifs();
  }, [searchText, offset]);

  const fetchGifs = async () => {
    const isSearch = searchText.trim() !== '';
    const endpoint = isSearch
      ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${searchText}&limit=${LIMIT}&offset=${offset}`
      : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=${LIMIT}&offset=${offset}`;

    try {
      if (!isFetchingMore) setLoading(true);
      const response = await axios.get(endpoint);
      const newGifs = response?.data?.data || [];
      setGifs((prev) => (offset === 0 ? newGifs : [...prev, ...newGifs]));
    } catch (error) {
      console.error('Error fetching GIFs:', error);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  };

  const handleSearch = (text) => {
    setSearchText(text);
    setOffset(0);
  };

  const loadMoreGifs = () => {
    if (!isFetchingMore) {
      setIsFetchingMore(true);
      setOffset((prev) => prev + LIMIT);
    }
  };

  const renderGif = ({ item }) => (
    <TouchableOpacity onPress={() => openGifModal(item)}>
      <Image style={styles.gif} source={{ uri: item.images.fixed_width.url }} resizeMode="cover" />
    </TouchableOpacity>
  );

  const openGifModal = (gif) => {
    setSelectedGif(gif);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const shareGif = () => {
    if (selectedGif) {
      const shareOptions = {
        title: 'Share GIF',
        message: 'Check out this cool GIF!',
        url: selectedGif.images.original.url,
        social: Share.Social.WHATSAPP,
      };
      Share.shareSingle(shareOptions);
    }
  };

  const downloadGif = async () => {
    if (selectedGif) {
      const { url } = selectedGif.images.original;
      const downloadDest = `${RNFS.DocumentDirectoryPath}/${selectedGif.id}.gif`;

      setIsDownloading(true);
      const options = {
        fromUrl: url,
        toFile: downloadDest,
        begin: (res) => console.log('Download started'),
        progress: (res) => {
          const progress = (res.bytesWritten / res.contentLength) * 100;
          setDownloadProgress(progress);
        },
      };

      try {
        await RNFS.downloadFile(options).promise;
        console.log('Download complete:', downloadDest);
        setIsDownloading(false);
      } catch (error) {
        console.error('Download error:', error);
        setIsDownloading(false);
      }
    }
  };

  const renderModalContent = () => (
    <View style={styles.modalContent}>
      {selectedGif && (
        <>
          <Image style={styles.modalGif} source={{ uri: selectedGif.images.original.url }} resizeMode="contain" />
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={shareGif} style={styles.button}>
              <Text style={styles.buttonText}>Share on WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={downloadGif} style={styles.button}>
              <Text style={styles.buttonText}>Download GIF</Text>
            </TouchableOpacity>
            {isDownloading && <Text>Downloading... {Math.round(downloadProgress)}%</Text>}
          </View>
        </>
      )}
      <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search GIFs..."
        value={searchText}
        onChangeText={handleSearch}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {loading && offset === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
        <FlatList
          data={gifs}
          renderItem={renderGif}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMoreGifs}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingMore ? <ActivityIndicator size="small" color="#0000ff" /> : null}
        />
      )}

      <Modal isVisible={modalVisible} style={styles.modal}>
        {renderModalContent()}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    padding: 10,
  },
  searchBar: {
    height: 50,
    backgroundColor: '#ff3131',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    fontSize: 16,
    elevation: 5,
  },
  row: {
    justifyContent: 'space-between',
  },
  gif: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
  },
  modalGif: {
    width: 300,
    height: 300,
    borderRadius: 10,
  },
  modalActions: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default Home;

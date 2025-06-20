import { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import "./styles.css";
import { ITEM_HEIGHT, VIEWPORT_HEIGHT } from "./constant";

const BUFFER_ITEMS = 10;

export default function App() {
  const [value, setValue] = useState("");
  const [showDropDown, setShowDropDwon] = useState(false);
  const [SuggestionData, setSuggestionData] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const controllerRef = (useRef < AbortController) | (null > null);

  const handleChange = (e) => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    setValue(e.target.value);
  };

  const handleKeyDown = (e) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev < SuggestionData.length - 1 ? prev + 1 : 0
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev > 0 ? prev - 1 : SuggestionData.length - 1
        );
        break;

      case "Enter":
        if (highlightIndex >= 0) {
          selectedValue = SuggestionData[highlightIndex];
        }
        setValue(selectedValue.name);
        setShowDropDwon(false);
        break;

      case "Escape":
        setShowDropDwon(false);
        break;

      case "Tab":
        setShowDropDwon(false);
        break;
    }
  };

  const handleClickOutside = () => {
    setShowDropDwon(false);
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const controller = new AbortController();
      controllerRef.current = controller;
      const response = await axios.get(
        // `https://rickandmortyapi.com/api/character/?name=${value}`,
        `https://pokeapi.co/api/v2/pokemon?limit=100&name=${value}`,
        {
          signal: controller.signal,
        }
      );
      console.log("response>>>>>", response);
      if (response.status == 200) {
        let results = response.data.results;
        // if (results.length > 5) {
        //   results = results.slice(0, 5);
        // }
        // results = response.data.results;
        // console.log("results<<<<", results);
        setSuggestionData(
          // results.map((item) => ({
          //   id: item.id,
          //   name: item.name,
          //   gender: item.gender,
          // }))
          results.map((item) => ({
            name: item.name,
            url: item.url,
          }))
        );
      } else if (response.status == 404) {
        alert("Character not found");
        setSuggestionData([]);
      }
    } catch (error) {
      alert("No Character found");
      setSuggestionData([]);
      console.log("error", error);
    }
    setLoading(false);
  };

  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_ITEMS
  );
  const endIndex = Math.min(
    SuggestionData.length,
    Math.ceil((scrollTop + VIEWPORT_HEIGHT) / ITEM_HEIGHT) + BUFFER_ITEMS
  );
  // const visible = SuggestionData.slice(startIndex, endIndex);
  const visible = useMemo(() => {
    return SuggestionData.slice(startIndex, endIndex);
  }, [startIndex, endIndex, SuggestionData]);

  const handleScroll = (e) => {
    console.log("scroll-top>>>", e.currentTarget.scrollTop);
    setScrollTop(e.currentTarget.scrollTop);
  };

  // console.log("SuggestionData>>>>", SuggestionData);

  useEffect(() => {
    const debounceDelay = setTimeout(() => {
      fetchData(value);
    }, 1000);
    return () => clearTimeout(debounceDelay);
  }, [value]);

  return (
    <div className="App">
      <h2>Search Box with Autocomplete</h2>
      <div style={{ marginLeft: "60px", position: "relative", width: "250px" }}>
        <input
          type="search"
          placeholder="Search..."
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowDropDwon(true)}
          value={value}
          style={{ width: "100%", padding: "8px" }}
        />
        {showDropDown && (
          <>
            {loading ? (
              <div style={{ padding: "8px" }}>Loading...</div>
            ) : SuggestionData && SuggestionData.length > 0 ? (
              <div
                onScroll={handleScroll}
                style={{
                  position: "absolute",
                  width: "100%",
                  background: "white",
                  border: "1px solid #ccc",
                  maxHeight: VIEWPORT_HEIGHT,
                  overflowY: "auto",
                  marginTop: "2px",
                  listStyle: "none",
                  padding: 0,
                  zIndex: 1000,
                }}
              >
                <div
                  style={{
                    height: SuggestionData.length * ITEM_HEIGHT,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: startIndex * ITEM_HEIGHT,
                      left: 0,
                      right: 0,
                    }}
                  >
                    {visible.map((item, idx) => {
                      const globalIdx = startIndex + idx;
                      const isActive = globalIdx === highlightIndex;

                      return (
                        <div
                          key={item.name} // Pokémon API doesn't return unique `id`, so use `name`
                          onMouseEnter={() => setHighlightIndex(globalIdx)}
                          onMouseDown={() => {
                            setValue(item.name);
                            setShowDropDwon(false); // typo fix
                          }}
                          style={{
                            padding: 8,
                            height: ITEM_HEIGHT,
                            background: isActive ? "#efefef" : "transparent",
                            cursor: "pointer",
                          }}
                        >
                          {item.name}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: "8px" }}>No suggestion found</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
